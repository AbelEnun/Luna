import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

const projectId = "demo-boutique-rules";
let testEnv;

const approvedBusiness = {
  ownerId: "owner",
  staffIds: ["owner", "staff"],
  status: "approved",
  slug: "sample-shop",
};

async function seedBusiness() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, "businesses", "shop-a"), approvedBusiness);
    await setDoc(doc(firestore, "businesses", "shop-a", "products", "piece-a"), {
      title: "Sample piece",
      price: 100,
      published: true,
    });
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8"),
    },
    storage: {
      rules: readFileSync(new URL("../../storage.rules", import.meta.url), "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

after(async () => {
  await testEnv?.cleanup();
});

test("business registration cannot self-approve", async () => {
  const owner = testEnv.authenticatedContext("new-owner").firestore();
  const pendingBusiness = {
    ownerId: "new-owner",
    staffIds: ["new-owner"],
    status: "pending",
  };

  await assertSucceeds(setDoc(doc(owner, "businesses", "pending-shop"), pendingBusiness));
  await assertFails(setDoc(doc(owner, "businesses", "approved-shop"), {
    ...pendingBusiness,
    status: "approved",
  }));
  await assertFails(setDoc(doc(owner, "businesses", "other-owner-shop"), {
    ...pendingBusiness,
    ownerId: "someone-else",
  }));
  await assertFails(setDoc(doc(owner, "super_admins", "new-owner"), {
    role: "platform_owner",
  }));
});

test("profiles and tenant products have the intended read/write boundaries", async () => {
  await seedBusiness();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", "customer-a"), {
      name: "Customer A",
      role: "customer",
    });
  });

  const customer = testEnv.authenticatedContext("customer-a").firestore();
  const stranger = testEnv.authenticatedContext("customer-b").firestore();
  const owner = testEnv.authenticatedContext("owner").firestore();
  const staff = testEnv.authenticatedContext("staff").firestore();
  const productPath = ["businesses", "shop-a", "products", "piece-a"];

  await assertSucceeds(getDoc(doc(customer, "users", "customer-a")));
  await assertFails(getDoc(doc(stranger, "users", "customer-a")));
  await assertSucceeds(getDoc(doc(testEnv.unauthenticatedContext().firestore(), ...productPath)));
  await assertFails(updateDoc(doc(stranger, ...productPath), { price: 1 }));
  await assertSucceeds(updateDoc(doc(owner, ...productPath), { price: 120 }));
  await assertSucceeds(updateDoc(doc(staff, ...productPath), { price: 130 }));
});

test("reservations are private to their customer and approved business members", async () => {
  await seedBusiness();
  const customer = testEnv.authenticatedContext("customer-a").firestore();
  const otherCustomer = testEnv.authenticatedContext("customer-b").firestore();
  const owner = testEnv.authenticatedContext("owner").firestore();
  const reservation = {
    customerId: "customer-a",
    customerName: "Customer A",
    customerEmail: "customer-a@example.test",
    productId: "piece-a",
    productTitle: "Sample piece",
    productImage: "",
    productPrice: 100,
    size: "M",
    note: "",
    status: "requested",
    createdAt: Timestamp.now(),
  };
  const reservationPath = ["businesses", "shop-a", "reservations", "request-a"];

  await assertSucceeds(setDoc(doc(customer, ...reservationPath), reservation));
  await assertFails(getDoc(doc(otherCustomer, ...reservationPath)));
  await assertSucceeds(getDoc(doc(customer, ...reservationPath)));
  await assertSucceeds(getDocs(collection(owner, "businesses", "shop-a", "reservations")));
  await assertFails(updateDoc(doc(customer, ...reservationPath), { status: "confirmed" }));
  await assertSucceeds(updateDoc(doc(owner, ...reservationPath), { status: "confirmed" }));
  await assertFails(setDoc(doc(otherCustomer, "businesses", "shop-a", "reservations", "spoofed"), {
    ...reservation,
    customerId: "customer-a",
  }));
});

test("chat threads and messages cannot be accessed across customers or tenants", async () => {
  await seedBusiness();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, "businesses", "shop-a", "chats", "customer-a"), {
      customerId: "customer-a",
      customerName: "Customer A",
      unreadByBusiness: true,
      unreadByCustomer: false,
      lastMessage: "Hello",
      lastMessageAt: Timestamp.now(),
    });
    await setDoc(doc(firestore, "businesses", "shop-a", "chats", "customer-a", "messages", "message-a"), {
      senderId: "customer-a",
      senderRole: "customer",
      text: "Hello",
      createdAt: Timestamp.now(),
    });
  });

  const customer = testEnv.authenticatedContext("customer-a").firestore();
  const stranger = testEnv.authenticatedContext("customer-b").firestore();
  const owner = testEnv.authenticatedContext("owner").firestore();
  const threadPath = ["businesses", "shop-a", "chats", "customer-a"];
  const messagePath = [...threadPath, "messages", "message-a"];

  await assertSucceeds(getDoc(doc(customer, ...threadPath)));
  await assertFails(getDoc(doc(stranger, ...threadPath)));
  await assertSucceeds(getDoc(doc(owner, ...threadPath)));
  await assertSucceeds(getDoc(doc(customer, ...messagePath)));
  await assertFails(getDoc(doc(stranger, ...messagePath)));
  await assertSucceeds(addDoc(collection(customer, ...threadPath, "messages"), {
    senderId: "customer-a",
    senderRole: "customer",
    text: "Question",
    createdAt: Timestamp.now(),
  }));
  await assertFails(addDoc(collection(stranger, ...threadPath, "messages"), {
    senderId: "customer-b",
    senderRole: "customer",
    text: "Unauthorized",
    createdAt: Timestamp.now(),
  }));

  const firstCustomer = testEnv.authenticatedContext("customer-c").firestore();
  const firstMessageBatch = writeBatch(firstCustomer);
  firstMessageBatch.set(doc(firstCustomer, "businesses", "shop-a", "chats", "customer-c"), {
    customerId: "customer-c",
    customerName: "Customer C",
    unreadByBusiness: true,
    lastMessage: "First message",
    lastMessageAt: Timestamp.now(),
  });
  firstMessageBatch.set(doc(collection(firstCustomer, "businesses", "shop-a", "chats", "customer-c", "messages")), {
    senderId: "customer-c",
    senderRole: "customer",
    text: "First message",
    createdAt: Timestamp.now(),
  });
  await assertSucceeds(firstMessageBatch.commit());

  await assertFails(addDoc(collection(customer, "businesses", "shop-a", "chats", "orphan-chat", "messages"), {
    senderId: "customer-a",
    senderRole: "customer",
    text: "Orphan",
    createdAt: Timestamp.now(),
  }));
});

test("only approved business members can upload business images", async () => {
  await seedBusiness();
  const owner = testEnv.authenticatedContext("owner").storage();
  const otherUser = testEnv.authenticatedContext("customer-a").storage();
  const unauthenticated = testEnv.unauthenticatedContext().storage();
  const image = new Uint8Array([137, 80, 78, 71]);
  const metadata = { contentType: "image/png" };

  await assertSucceeds(uploadBytes(ref(owner, "businesses/shop-a/photo.png"), image, metadata));
  await assertFails(uploadBytes(ref(otherUser, "businesses/shop-a/unauthorized.png"), image, metadata));
  await assertFails(uploadBytes(ref(unauthenticated, "businesses/shop-a/anonymous.png"), image, metadata));
});

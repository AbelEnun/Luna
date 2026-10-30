/**
 * Helper to calculate business day counter and 30-day free trial status.
 * Starts from Day 1 the instant the company is created.
 * First month (30 days) is a free trial.
 */
export function getBoutiqueAgeAndTrial(business) {
  if (!business) {
    return {
      daysActive: 1,
      daysPassed: 0,
      TRIAL_DAYS: 30,
      isTrial: true,
      trialDaysRemaining: 30,
      isTrialExpired: false,
      trialProgressPercent: 3,
      createdFormatted: "Just now",
      trialEndsFormatted: "In 30 days",
    };
  }

  let createdDate = new Date();
  if (business.createdAt?.toDate) {
    createdDate = business.createdAt.toDate();
  } else if (business.createdAt?.seconds) {
    createdDate = new Date(business.createdAt.seconds * 1000);
  } else if (business.createdAt) {
    createdDate = new Date(business.createdAt);
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - createdDate.getTime());
  const daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Day counter starts on Day 1 the instant the boutique is created
  const daysActive = daysPassed + 1;

  const TRIAL_DAYS = 30; // First month free trial
  const isTrial = daysPassed < TRIAL_DAYS;
  const trialDaysRemaining = Math.max(0, TRIAL_DAYS - daysPassed);
  const isTrialExpired = daysPassed >= TRIAL_DAYS;

  // Progress of the trial (from 1 to 100%)
  const trialProgressPercent = Math.min(100, Math.max(3, Math.round(((daysPassed + 1) / TRIAL_DAYS) * 100)));

  const trialEndDate = new Date(createdDate.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  return {
    daysActive,
    daysPassed,
    createdDate,
    trialEndDate,
    TRIAL_DAYS,
    isTrial,
    trialDaysRemaining,
    isTrialExpired,
    trialProgressPercent,
    createdFormatted: createdDate.toLocaleDateString(),
    trialEndsFormatted: trialEndDate.toLocaleDateString(),
  };
}


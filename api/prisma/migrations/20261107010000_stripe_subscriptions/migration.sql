CREATE TABLE "user_subscriptions" (
 "userId" TEXT NOT NULL PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "stripeCustomerId" TEXT NOT NULL,
 "stripeSubscriptionId" TEXT,
 "planKey" TEXT,
 "status" TEXT NOT NULL DEFAULT 'none',
 "currentPeriodEnd" TIMESTAMP(3),
 "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "user_subscriptions_stripeCustomerId_key" ON "user_subscriptions"("stripeCustomerId");
CREATE UNIQUE INDEX "user_subscriptions_stripeSubscriptionId_key" ON "user_subscriptions"("stripeSubscriptionId");
CREATE TABLE "stripe_events" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "type" TEXT NOT NULL,
 "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

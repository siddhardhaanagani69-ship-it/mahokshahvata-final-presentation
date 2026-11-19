window.COPY = {
 "title": {
  "subtitle": "A paper-trading platform, moved from one laptop to Google Cloud",
  "notes": ""
 },
 "problem": {
  "headline": "On a laptop, it worked for exactly one person.",
  "p1": "The laptop sleeps, and the site is gone",
  "p2": "Accounts in a SQLite file on one disk",
  "p3": "API keys in a .env file and a key file",
  "p4": "Deploys by copying files, with no undo",
  "p5": "No HTTPS, no logs, no alerts",
  "f1": "2–4 copies on GKE that replace themselves",
  "f2": "Cloud SQL on a private IP, with daily backups",
  "f3": "Secret Manager and a service account, no key files",
  "f4": "Every push tested, deployed, rolled back on failure",
  "f5": "Managed certificate, JSON logs, email alerts",
  "closer": "Same app, same features. What changed is who can depend on it.",
  "notes": ""
 },
 "path": {
  "headline": "Six milestones took it from localhost to a self-healing cluster.",
  "m1": "FastAPI and SQLite on one laptop",
  "m2": "The same code on one small VM",
  "m3": "One Docker image, laptop and cloud alike",
  "m4": "Accounts and files moved to managed services",
  "m5": "Kubernetes, HTTPS and autoscaling",
  "m6": "Logs, alerts, Terraform and CI/CD",
  "closer": "The riskiest step was the data: 39 of 39 rows moved, with their ids kept.",
  "notes": ""
 },
 "arch": {
  "headline": "The pods keep nothing, so any one of them can fail.",
  "notes": ""
 },
 "resil": {
  "headline": "We broke it on purpose, and the site never returned an error.",
  "s1": "for a deleted pod to be replaced and Ready again",
  "s2": "copies under a load test, then back to two",
  "s3": "requests answered OK while we deleted a pod and drained a node",
  "closer": "Liveness asks if the app is running. Readiness asks if it can reach the database.",
  "notes": ""
 },
 "ship": {
  "headline": "Every push to master ships itself, and a bad one rolls itself back.",
  "rollback": "The pipeline runs kubectl rollout undo, then checks the old version is serving again.",
  "e1": "2 min 53 s from git push to the new version live",
  "e2": "A release listening on the wrong port rolled itself back, with nobody touching it",
  "notes": ""
 },
 "watch": {
  "headline": "When the app fails, it shows up in logs, on a chart and in our inbox.",
  "e1": "Three controlled 500s. The metric went from 0 to 3, and the alert opened.",
  "notes": ""
 },
 "code": {
  "headline": "Our cloud is code, and terraform plan says No changes.",
  "t1": "Network: private services access and the global IP",
  "t2": "Data: Cloud SQL, the bucket and three secrets",
  "t3": "Compute: the GKE cluster, node pool and image registry",
  "t4": "Monitoring: 5xx metric, alert, dashboard, CI identity",
  "o1": "Kubernetes objects: the pipeline owns the image tag",
  "o2": "Secret values, so they never land in Terraform state",
  "o3": "Budget alerts, which live on the billing account",
  "notes": ""
 },
 "prod": {
  "headline": "What we'd change before real users depend on it.",
  "r1": "One zone, and Cloud SQL has no standby",
  "r2": "Rate limits and caches live inside each pod",
  "r3": "No email verification or password reset",
  "r4": "Free market data, about 15 minutes delayed",
  "r5": "An alert on any single 5xx",
  "r6": "Every push goes straight to production",
  "f1": "Regional GKE and Cloud SQL with automatic failover",
  "f2": "Shared Redis (Memorystore), so every pod agrees",
  "f3": "Identity Platform: verified email, reset, MFA",
  "f4": "A licensed real-time feed we're allowed to show users",
  "f5": "SLO alerts on error rate and latency, plus on-call",
  "f6": "A staging environment, then canary releases",
  "notes": ""
 },
 "demo": {
  "d1": "Sign in and open the dashboard",
  "d2": "Search a stock and click Explain this stock",
  "d3": "Place a paper trade and watch the portfolio update",
  "d4": "Trigger a controlled error and find its log line",
  "notes": ""
 },
 "close": {
  "headline": "Running is not the same as ready.",
  "story": "Our first VM deploy printed “Deployed”. Then the site answered 502 for up to 90 seconds while the app was still starting.",
  "lesson": "That lesson became our readiness probe and the pipeline's health check.",
  "closing": "Thank you. Questions?",
  "notes": ""
 },
 "whatif": {
  "headline": "What if…?",
  "q1": "Cloud SQL drops for 30 seconds?",
  "a1": "Pods fail readiness and leave the load balancer. Nothing restarts; they rejoin when the database answers.",
  "q2": "Traffic suddenly spikes?",
  "a2": "The autoscaler adds pods, up to four, and a third node. For more, we raise those limits.",
  "q3": "A release is broken?",
  "a3": "New pods never pass readiness, old pods keep serving, and the pipeline rolls back.",
  "q4": "Our zone goes down?",
  "a4": "Today the site goes down; the data is safe in daily backups. In production, regional failover.",
  "q5": "A credential leaks?",
  "a5": "There are no downloadable keys. Secrets rotate in Secret Manager by adding a new version.",
  "q6": "The bill runs away?",
  "a6": "A $50 budget alerts at $10, $25 and $50. The two GKE nodes cost about $2.20 a day.",
  "notes": ""
 },
 "decisions": {
  "headline": "Why we built it this way",
  "q1": "Why GKE, not Cloud Run?",
  "a1": "The app runs a background thread that refreshes 3,000 quotes every 5 minutes, and a daily autopilot. Cloud Run pauses between requests; GKE keeps them running.",
  "q2": "Why Cloud SQL, not Firestore?",
  "a2": "Portfolios and trades are relational. A trade locks its portfolio row, and a Postgres advisory lock keeps the autopilot to one replica.",
  "q3": "Why no key files anywhere?",
  "a3": "The app runs as a service account, and GitHub signs in through Workload Identity Federation. A key that doesn't exist can't leak.",
  "q4": "Why keep Kubernetes objects out of Terraform?",
  "a4": "The pipeline owns the image tag and the HPA owns the replica count. In Terraform, every deploy would show up as drift.",
  "notes": ""
 }
};

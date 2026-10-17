---
id: oncall-week-2026-10-13
title: On-call week of 13 Oct 2026
topic: oncall-week-2026-10-13
sample: false
captured: 2026-10-17T09:00:00.000Z
---

wk of 13 oct 2026. raw oncall + slack. not cleaned. dont quote this in a retro as-is.

mon 13 oct

08:12 pages started before coffee. 3 dupes from the same check.

staging checkout synthetic failing since 07:40. not prod. status page still green. i checked https://status.example.com/checkout before paging the world.

error is 401 from the synthetic, not 500. the robot user password was rotated fri by iam-bot and nobody updated the check in grafana. handy board: https://grafana.example.com/d/checkout-synth

pinged Leila Ortiz in #observability (@leila). she said the secret lives in the synthetic namespace, key CHECKOUT_ROBOT_PASSWORD, not in the grafana ui. i kept looking in the wrong place for 20 min.

cheat: kubectl -n synthetics get secret checkout-robot -o jsonpath='{.data.CHECKOUT_ROBOT_PASSWORD}' | base64 -d
then restart the blackbox pod. the pod caches the env at start.

known issue: the grafana ui "test now" button uses a different secret, the one in the grafana db. it can pass while the cron still fails. dont trust the button.

fixed 08:46. leaked 4 pages. leila will add a note to the runbook https://intranet.example.com/runbooks/synthetics-secrets

09:05 standup dumped on me while i was still in the page.

platform discussion, not an incident: nico wants every service on the golden path chart by nov. app teams say the chart cant set a sidecar annotation they need for the mesh. nico says stop forking the chart, open a pr on the template. thread in #platform-golden-path. no decision. owner is Nico Alvarez (@nico).

i wrote down the ask so i dont relitigate it: sidecar annotation lives in values.podAnnotations today and gets stripped. they need it under values.mesh.annotations. nico agreed thats a real gap, not a special case.

doc he waved at: https://intranet.example.com/docs/golden-path-chart

10:40 ci queue. main is red on payments-api only. rest of monorepo is fine.

job "integration" pending 26 min. runners are busy, not failed. github-hosted ubuntu pool. we burned the included minutes on sunday's rebuild-the-world.

talked to Priya Shah, same person as the vpn thing, but this was in #ci-runners (@priya). she said dont buy more minutes yet. the sunday job was a manual workflow_dispatch with no timeout, someone left it. cancel it.

cheat: org settings -> actions -> the running workflow is "rebuild images", actor is sam. cancel from the ui, not the api. the api token in ci cant cancel another user's run.

url: https://github.com/example-org/payments-api/actions
known issue: cancelling doesnt free the minutes already billed. it only stops the bleed. priya wants a 60 min timeout on workflow_dispatch. i didnt change it. she said she'll pr it.

11:15 side argument in #supply-chain. security (Jonah Peck, @jonah) wants all github actions pinned to a full sha, not a tag. devs hate the renovate noise. jonah's point: tags move, the xz thing is old but the pattern isnt. he sent https://intranet.example.com/docs/actions-pinning

current compromise on the table, not agreed: pin sha, let renovate group updates weekly, one pr per repo on monday. app teams said weekly is still too many. nico said platform will own a shared composite action so teams pin one sha not forty.

i am not the decider. note it so the next oncall doesnt restart the fight.

12:05 lunch. cluster looked fine. left it.

13:20 user report, not a page. merchant portal "sometimes" logs people out.

not payments-api. its the portal bff. cookie SameSite flipped in fridays change. chrome is strict, firefox still worked, which is why qa missed it.

contact: Dana Okonkwo, portal oncall, slack @dana in #merchant-portal.
she said revert is worse, the old cookie was missing Secure on one path. fix is SameSite=None and Secure together. both. the pr is https://github.com/example-org/merchant-portal/pull/4412

merged 13:58. needs a hard refresh. tell support that. dont tell them to clear all cookies, that kills the cart.

known issue: the admin impersonation cookie is a second cookie, IMPERSONATE, and it was not updated. dana knows. follow-up ticket PLAT-1884. if someone says impersonation is broken tomorrow, its this, not auth0.

handy: https://intranet.example.com/docs/cookie-policy

14:10 terraform. i was not in this one but sam slacked me the trail so oncall has it.

prod network stack, plan only, locked. state lock held by a local apply from a laptop, cidr change that never finished. lock id in the error. sam didnt force-unlock until he saw the holder was himself from saturday.

contact: Sam Ibarra (@sam) #infra-terraform
cheat: terraform force-unlock <id> only after you see the holder in the dynamo lock table. table is tf-locks-prod, region us-east-1. dont unlock a lock from a ci apply that is still running.
runbook: https://intranet.example.com/runbooks/tf-state-lock

known issue: the lock row can outlive the process if the laptop slept. the apply is dead. the row is not.

he unlocked 14:22. no apply. the cidr change is NOT in prod. he will re-plan tuesday with a buddy.

15:00 discussion in #finops, dropped here because it will become a page if we ignore it.

cloud cost up 18% week over week. the line is logging, not compute. debug=true left on in the otel collector for the mesh experiment. every span, no tail sampling.

Mei Chen (@mei) in #observability says turn the debug attribute off, dont rip the collector out. the experiment is the gateway-api canary and she still needs the traces, just not 100% of them.

cheat: the flag is in deploy/observability/collector-values.yaml key config.debug, not the env DEBUG. there are two. the env one does nothing now.
doc: https://intranet.example.com/docs/otel-sampling

decision today: mei will set tail sampling to 10% on errors-always, tomorrow morning change window. nico signed off in the thread. not done yet as of my handoff. if the bill channel pings overnight, this is why, and the change is scheduled, not forgotten.

16:40 egress proxy blip. 4 min. internal only.

apps calling the sanction list vendor timed out. vendor status was green. our egress nat gateway exhausted ports. payments-api was the noisy one, retries with no jitter.

looked at https://grafana.example.com/d/nat-ports
contact: the person who actually knows nat is Ravi Patel (@ravi) #net-help. priya was in the vpn channel and told me to stop pinging her for this.

ravi: short term, raise the retry budget down. yes down. the client retries 8 times. he wants 3 with jitter. code change, not a firewall change. owner is the payments team, ticket PAY-2201, assignee unknown, i put oncall.

known issue: adding a second nat gateway without the client fix just moves the cliff. we did that in may. dont propose it again in the incident channel.

runbook draft, half written: https://intranet.example.com/runbooks/nat-port-exhaustion

17:10 no more pages. wrote the above so tue oncall isnt blind.

tue 14 oct

07:55 page. cert. the one we always forget.

internal ingress for grafana.example.com. not the public cert. cert-manager challenge stuck. lets encrypt said rate limit, but its a private zone, it should be our step-ca, not lets encrypt.

someone annotated the ingress with cert-manager.io/cluster-issuer: letsencrypt-prod last week during the golden path trial. that issuer cant see the private dns.

contact: Leila again (@leila) and also Otto Berg who runs the internal ca (@otto) #pki
otto: delete the annotation, set issuer to step-ca-internal, delete the failed certificate and the secret so it reorders. secret name is grafana-tls in ns observability.

cheat: kubectl -n observability describe certificate grafana-tls | grep -A2 Failed
the error "waiting for dns" on a private name means the wrong issuer. it is not a route53 problem.

known issue: if you delete the secret while an old pod still has it mounted, grafana stays up on the expired cert until you roll it. roll the deploy after the new secret is Ready.

doc: https://intranet.example.com/runbooks/internal-certs
fixed 08:37. cert valid thru 12 jan 2027. put that date in the oncall calendar. the alert is 14 days out and we missed the 30 day one because it pages #pki not #oncall. otto will add #oncall. not done this morning.

09:20 standup notes, arguments mostly.

1. gateway api. mei wants to stop writing ingress yaml. istio ingress gateway stays for now. the canary is one host, shop.example.com, on gateway api. nico says no second migration while golden path chart is open. mei says the ingress annotation mess is why the cert went to the wrong issuer. both are right. no date picked. thread #service-mesh

2. oncall ownership. product oncall keeps getting platform pages (cert, nat, runners). ravi's proposal: platform takes sev pages for anything in ns kube-system, observability, ingress, ci. product keeps app 5xx. the fight is synthetics. leila says synthetics are hers. product says a bad synthetic wakes them. proposal: synthetics page the owning team label. needs the robot secret thing from monday fixed first or the label is a lie.

3. renovate. 40 prs overnight. people are closing them unread. jonah (security) says that is how we get a surprise. compromise still the weekly grouped pr. nico will pilot it on payments-api and the chart repo only. not all repos. start next monday.

10:05 image pull backoff. new. staging only. payments-api again, different from the memory crashloop last week.

error: toomanyrequests on docker hub. someone referenced postgres:16 in a test compose that the ci dind uses. we dont mirror postgres official.

contact: Priya (@priya) #ci-runners
fix she wanted: point the test at 123456789.dkr.ecr.us-east-1.amazonaws.com/mirror/postgres:16
the mirror already exists. the compose file was copied from a blog.

pr: https://github.com/example-org/payments-api/pull/3890 merged 10:41.
known issue: the mirror job only copies tags we list in mirror-images.txt. a floating tag like postgres:16 will go stale. pin 16.4 in the test. i did not. left a comment on the pr.

cheat: if ecr pull fails with 403 not 429, that is a different bug, the node role lost ecr:GetAuthorizationToken. 429 / toomanyrequests is docker hub. read the registry host in the error before you rotate iam.

11:30 backup drill. scheduled, not a surprise, still failed.

the restore of payments ledger into the drill account timed out at the wal apply step. snapshot is fine. the drill rds is a smaller class than prod and the apply couldnt keep up. 2 hours then cancelled.

contact: Helen Cho, data oncall (@helen) #data-platform
she said dont grow the drill instance as the "fix". the drill should use the same class for the apply window and scale down after. ticket DATA-774. she will do it. the drill is red. the backup itself is good. i dont want the next person to read "drill failed" and think we have no backup.

proof the snapshot exists: aws rds describe-db-snapshots --db-instance-identifier payments-ledger-prod --snapshot-type automated
latest was 14 oct 06:11 utc. runbook https://intranet.example.com/runbooks/rds-restore-drill

known issue: the drill security group does not allow the restore box to grafana, so you cant see the apply lag unless you are on the box. helen has the ssh via the bastion. i dont. dont restart the drill to "watch it" .

13:45 flaky test on main. payments-api TestChargeIdempotency. failed twice, passed on rerun. classic.

not a customer issue. it blocks the golden path freeze if main stays red.

looked at the log. the test hits a shared redis and another job flushed it. the key prefix is charge:test with no build id.

contact: the author in the blame is Marco Velez (@marco) #payments-dev. he was in a meeting. his slack reply at 14:20: "prefix the key with GITHUB_RUN_ID, i'll pr tonight. rerun for now."

i reran. green 14:28. the fix is not in. if it fails again overnight it is still this.
issue link he pasted: https://github.com/example-org/payments-api/issues/3894

15:10 pdb blocked a node drain. one node NotReady, stuck.

payments-api pdb minAvailable 2, only 2 replicas on that node pool because the other pool is cordoned for the kernel bump. drain cant evict.

contact: Ravi (@ravi). he said do not delete the pdb. scale the deploy to 3, let one land on the good pool, then drain.

cheat: kubectl get pdb -A | awk '$3==$4'
thats the ones with no disruption budget left. disruptionsAllowed == 0.

kernel bump is paused. ravi will uncordon the pool tomorrow after the scale. node is still NotReady. the pod on it is crash looping for a different reason? no. it cant be rescheduled. the app is up on the other replica. no customer impact. say that if someone sees the node alert.

16:00 argocd app "shop-gateway" OutOfSync. mei' s canary.

the diff is an annotation argocd itself writes, argocd.argoproj.io/tracking-id, showing as a drift. not a real diff. she knew. the sync wave failed earlier for an unrelated crd.

fix: ignore the annotation in the compare options. she edited the app project. synced. healthy 16:22.

doc: https://intranet.example.com/docs/argocd-ignore-differences
known issue: if you hit sync --force on this app it will recreate the gateway and drop the canary traffic for a minute. she made me say it back to her. i said it back.

17:05 handed off in #oncall-handoff. open items for wed, which is me again because omar is out:

- otel debug flag still on until mei's tue morning window. check it actually happened.
- PLAT-1884 impersonation cookie.
- DATA-774 drill instance size.
- TestChargeIdempotency pr from marco, maybe.
- node pool still cordoned.
- actions pin policy, no action, just dont restart the argument.

wed 15 oct

08:00 checked mei's change first, before the queue.

collector-values.yaml config.debug is false. tail_sampling is on. error traces kept, rest 10%. grafana still shows the gateway canary. good.

the cost channel has not updated yet. it lags a day. dont declare victory in #finops.

08:30 page. this one was real-ish. prod. short.

payments-api error rate 6% for 7 minutes. 08:11 to 08:18 utc. deploy of the idempotency prefix fix, marco's pr, shipped with a bad config default.

the new code expects IDEMPOTENCY_REDIS_PREFIX. the deploy didnt set it. empty prefix. keys collided with a different service that uses the same redis. charges got "already processed" for new ids.

rollback: argocd history, the previous sha a1c90ee. i did not patch the live deploy. we learned that from the memory incident, argocd puts it back.

contact during the page: Marco (@marco) confirmed rollback. Asha (@asha) was in #platform-deploys and watched the sync. she didnt drive.

customer impact: about 140 checkout posts rejected. support macro is "retry, the duplicate message was wrong." no double charge. helen confirmed no ledger dupes. good.

after rollback, marco's follow-up: default the prefix in code to the service name, dont rely on the env. pr https://github.com/example-org/payments-api/pull/3902 merged 11:05. redeployed. error rate normal.

runbook we should have opened first: https://intranet.example.com/runbooks/payments-rollback
cheat: argocd app get payments-api --show-operation  shows if a sync is mid flight. dont roll back while a sync is running or you race.

known issue: the bad keys are still in redis until ttl 24h. a retry of a charge that failed during the 7 min can still hit a stale "already processed". marco says the key includes a date now so tomorrow its gone. if support sees the error again before thu 08:18 utc, it can be a leftover key. after that, its a new bug.

09:40 postmortem scheduling. nico wants a short one, not a two hour. friday 16:00. attendees marco, helen, me, asha optional. doc stub https://intranet.example.com/incidents/2026-10-15-idempotency-prefix

action already agreed: no env-only config for a new required setting. chart should fail the pod if the key is missing. not implemented.

10:15 discussion, #devex, relevant because it changes how we ship the above.

backstage software catalog is half adopted. portal team likes it. payments ignores it. the golden path button "create service" still emits the old ingress annotation. that is the same annotation that sent grafana to lets encrypt. otto is annoyed. nico said the template is the source of truth and backstage is a client. so fix the template, not backstage. owner nico. template repo https://github.com/example-org/golden-path-template

i asked if the idempotency prefix would have been caught by the template. nico said only if the template grows a required-env check. he put it on the chart backlog, not this week.

11:50 dns. scary for 90 seconds, then fine.

api.example.com SERVFAIL from one resolver, 1.1.1.1, not from 8.8.8.8. our route53 was fine. it was a cloudflare resolver blip. status https://www.cloudflarestatus.com showed dns degraded, recovered while i was typing.

contact: i pinged ravi. he said if both resolvers fail, then its us, check the zone. if only one fails, wait 5 min before you touch route53. i waited. it cleared.

known issue: the oncall phone uses a resolver on the corp net that caches longer. my phone still failed for 3 min after public dns was fine. dont use the phone as the probe. use https://grafana.example.com/d/dns-multi

no change made. good.

13:00 feature flag service slow. not down.

flags.internal p99 800ms. checkout timed out the flag read and used the default, which is "new tax off". so we under-collected tax on staging only. prod timeout is higher and didnt trip. say that clearly if finance asks.

contact: Dana (@dana) owns the flag client. the flag service owner is Stefan Vogel (@stefan) #flags.
stefan: a bad rollout of the flag sdks cache. he reverted the sdk sidecar. p99 back to 40ms at 13:22.

cheat: the default the client uses is in the repo, file flags/defaults.json, not in the flag ui. the ui can say tax on while the timeout default says off. read the file before you argue with finance.

doc: https://intranet.example.com/docs/flag-timeout-defaults
known issue: staging and prod defaults files have drifted. staging defaults.json has two keys prod doesnt. stefan filed FLAG-90. not a today fix.

14:30 disk. again.

the log volume on the otel gateway node hit 85%. not the debug flag this time. a single merchant, id 44821, started sending 200kb payloads in a header for a debug session they forgot.

mei: drop that header in the collector, attribute http.request.header.debug_session. she shipped the collector config. disk flattening 15:10.

known issue: the drop rule is on the gateway collector only. the daemonset still writes the header to the node local disk for 15 min of buffer. if the node alert stays, its the buffer draining, not a failed fix.

15:40 ci clock skew. weird one. worth keeping.

a release job signed an image and cosign said the cert was from the future. runner clock was 6 min fast. ntp not running in the self-hosted image. the github-hosted runners were fine. this job is pinned to self-hosted because it needs the corp net.

contact: Priya (@priya). fix: she rebuilt the runner image with chrony. jobs after 16:20 signed fine.
image: ghcr.io/example-org/runner:2026.10.15
runbook note she added at the bottom of https://intranet.example.com/runbooks/self-hosted-runners

cheat: on the runner, timedatectl show -p NTPSynchronized. if no, dont retry the sign. you will produce another bad attestation. wait for the new image.

16:30 waf false positive. prod, low volume.

a legitimate merchant bulk upload, path /v1/catalog/import, body is a csv. waf rule AWS#ManagedSQLi saw a quote and a semicolon in a product title and blocked 12 requests. 403, body was the waf html not our json. clients retried and made it look like a spike.

contact: Jonah (@jonah) for the exception, not the app team. he added a scope-down on that path for the sqli rule group only. other rules still apply. change is in the waf web acl, not in terraform yet. he promised a tf pr tomorrow so the console change doesnt drift.

ticket SEC-551. handy console is the security account, not the app account. i didnt have access. dont go hunting in the wrong account.

known issue: if terraform runs tonight from main it might revert his console edit. i told him. he set a hold on the waf tf pipeline until his pr. check thu that the hold is gone or the next person will page him.

17:20 done. open:

- redis stale keys until thu morning
- waf tf hold
- FLAG-90 defaults drift
- node pool cordon, ravi said tomorrow, so thu
- postmortem fri 16:00

thu 16 oct

08:05 no page overnight. checked the three landmines.

payments-api error rate flat. the stale redis message did not come back in support. marco says ttl is falling off. ok.

waf: jonah's tf pr merged, pipeline hold removed, plan showed no diff. console and code match. SEC-551 can close after he says so. i am not closing security tickets.

node pool: ravi uncordoned at 08:30 as promised. drain completed. pdb disruptions allowed is 1 again. kernel bump still NOT done. he moved it to next week. the node that was NotReady rejoined. forget the kernel unless he asks.

09:00 office hours, #platform-ask. writing the ones that will boomerang.

- team ledger wants a gpu node for a batch job. nico said no, use the existing batch account, gpus in the main cluster are for the recs team and they are full. contact for batch is Helen (@helen). doc https://intranet.example.com/docs/batch-account
- team notifications wants to mount the docker socket in a build pod. priya said no in the thread, three times. the answer is the kaniko template. https://intranet.example.com/docs/kaniko-template
- someone asked to turn off branch protection for a hotfix. the answer is the break-glass group, not unprotect main. break-glass is #release-break-glass, needs two acks, nico and the app owner. we did not use it today.

10:20 s3. a dev couldnt find a heap dump he uploaded monday.

bucket debug-dumps-staging, prefix payments-api/. lifecycle rule expires objects at 3 days. it worked as designed. he thought it was 30 days. the rule was changed in aug and the readme still says 30.

contact: Sam (@sam) owns the bucket policy. he wont extend the lifecycle. dumps have customer payloads sometimes. the readme is wrong. i fixed the readme line in https://github.com/example-org/platform-docs/pull/220
known issue: a lifecycle change doesnt restore deleted objects. if he needs that dump, its gone. there is no versioning on that bucket on purpose.

11:45 deploy queue discussion. write this down, it came up twice.

people want prod deploys anytime. nico wants a quiet window 16:00-18:00 local so oncall isnt solo during school pickup. the idempotency incident was 08:11 utc which is morning here, so the window wouldnt have caught it. asha said the window is theater unless we also require the chart required-env check. nico agreed the check matters more. window stays as a social rule, not a pipeline gate. dont tell a team the pipeline will block them. it wont.

12:30 rabbitmq. one queue depth, emails-retry, climbed to 80k. not paged. a consumer deploy set concurrency to 1 by mistake. helm value worker.concurrency, default in the chart is 1, their old override was 20 and the golden path migration dropped the override.

this is the golden path stripping values again. same family as the sidecar annotation.

contact: the notifications oncall is Bea Santos (@bea) #notifications.
fix: put worker.concurrency: 20 back in their values. she did. queue drained by 13:40.
she is annoyed. nico has the example now for the template backlog. i linked her thread in #platform-golden-path.

known issue: concurrency 20 with the old prefetch flooded the mail vendor in june. dont set it to 100 to "drain faster". 20 is the number they tuned. vendor limit doc is in her channel canvas, not a url i have.

14:00 secret rotation. scheduled. broke one cron.

iam rotated the slack webhook url used by the budget alert lambda. the lambda env was updated. a second copy of the webhook lives in a k8s secret for the in-cluster notifier, and that one was not in the rotation list.

symptom: budget alerts in slack stopped. the lambda ones still arrived. two senders. easy to miss.

contact: Mei (@mei) for the notifier, Sam for which secret the rotation script knows about.
secret: ns observability, name slack-budget, key url.
script list: infra/rotation/manifest.yaml. the k8s secret is not in it. sam added it in a pr, not merged, https://github.com/example-org/infra/pull/1502

cheat: if slack alerts stop, check both senders before you rotate again. rotating twice invalidates the first url and then both are wrong.

known issue: the webhook in git history of an old values file is still valid until slack regenerates. jonah wants that file purged. not today. dont paste the url into this note. i didnt.

15:15 test in prod, small. marco asked me to watch.

the prefix default deploy. error rate didnt move. p99 didnt move. redis key sample shows the service name prefix. good. he watched too.

16:40 almost quit. one more.

a node in staging OOMKilled the buildkit pod and took the node. staging deploys queued. not prod.

priya: buildkit limit was unset so it ate the node. she set limits.memory 8Gi. pod came back. queue cleared 17:05.
known issue: 8Gi is a guess. the monorepo image build peaked at 7.1. if it grows we will flap again. she filed CI-640 to split the build.

17:10 handoff note for fri oncall (omar is back):

- postmortem fri 16:00, idempotency, doc linked above. read it before you walk in.
- infra pr 1502 rotation manifest, not merged.
- golden path keeps eating overrides. sidecar, worker concurrency. if a migrated app "suddenly" has the chart default, check their old values before you debug the app.
- kernel bump slipped a week. ravi.
- dont buy gh actions minutes. timeout pr is priya's.
- finops number lags. otel debug is already off.

fri 17 oct

morning skim only. i am not oncall. leaving this here so the file is complete.

08:20 omar ack'd the handoff in #oncall-handoff. he found the buildkit limit thing already. no new page by 09:00.

discussion still open, so the next person doesnt think they were decided:

- actions pinned to sha vs tags. pilot is payments-api + chart repo, weekly grouped renovate, starts monday 20 oct. jonah and nico. not a policy for all repos yet.
- gateway api vs ingress. one host in canary. no cutover date.
- quiet deploy window 16:00-18:00 is social, not enforced.
- synthetics paging. waiting on the label work. leila.
- required env in the chart. backlog. would have caught IDEMPOTENCY_REDIS_PREFIX.
- gpu in the main cluster. no.

if someone asks "was there an outage": the only prod blip this week was wed 08:11-08:18 utc, payments-api, false duplicate charges, rollback to a1c90ee, about 140 requests, no double charge. everything else was staging, ci, certs, or a drill.

end of scribble.

```json cards
[
  {
    "kind": "resolution",
    "topic": "checkout-synthetic-401",
    "title": "Update the synthetic robot secret and restart blackbox",
    "body": "Monday 13 Oct, staging only. Checkout synthetic was 401 since 07:40 because iam-bot rotated the robot password on Friday and Grafana was not updated. The status page stayed green. Fixed at 08:46 after updating the secret in the synthetics namespace and restarting the blackbox pod. Four duplicate pages leaked.",
    "steps": [
      "Update CHECKOUT_ROBOT_PASSWORD on secret checkout-robot in namespace synthetics",
      "Restart the blackbox pod so it reloads the env"
    ]
  },
  {
    "kind": "contact",
    "topic": "checkout-synthetic-401",
    "title": "Leila Ortiz",
    "body": "Observability contact for the checkout synthetic 401.",
    "contactName": "Leila Ortiz",
    "contactChannel": "Slack @leila in #observability"
  },
  {
    "kind": "doc",
    "topic": "checkout-synthetic-401",
    "title": "Synthetics secrets runbook",
    "body": "Leila will add a note to this runbook. The secret is not in the Grafana UI.",
    "url": "https://intranet.example.com/runbooks/synthetics-secrets"
  },
  {
    "kind": "url",
    "topic": "checkout-synthetic-401",
    "title": "Checkout synthetic board",
    "body": "Board checked before paging. Status page was https://status.example.com/checkout and was still green.",
    "url": "https://grafana.example.com/d/checkout-synth"
  },
  {
    "kind": "cheat",
    "topic": "checkout-synthetic-401",
    "title": "Secret is in the synthetics namespace",
    "body": "The password is on secret checkout-robot in namespace synthetics, key CHECKOUT_ROBOT_PASSWORD. The blackbox pod caches env at start, so restart it after the change."
  },
  {
    "kind": "known_issue",
    "topic": "checkout-synthetic-401",
    "title": "Grafana test-now uses a different secret",
    "body": "The Grafana UI test-now button uses the secret in the Grafana database. It can pass while the cron still fails. Do not trust that button."
  },
  {
    "kind": "contact",
    "topic": "golden-path-sidecar",
    "title": "Nico Alvarez",
    "body": "Owner of the golden-path chart discussion. He wants every service on the chart by November. No decision yet. Stop forking the chart and open a PR on the template.",
    "contactName": "Nico Alvarez",
    "contactChannel": "Slack @nico in #platform-golden-path"
  },
  {
    "kind": "doc",
    "topic": "golden-path-sidecar",
    "title": "Golden path chart doc",
    "body": "Doc Nico pointed at. Sidecar annotation in values.podAnnotations is stripped. The mesh need is values.mesh.annotations. He agreed that is a real gap.",
    "url": "https://intranet.example.com/docs/golden-path-chart"
  },
  {
    "kind": "known_issue",
    "topic": "golden-path-sidecar",
    "title": "Chart strips podAnnotations",
    "body": "As of Monday the sidecar annotation under values.podAnnotations is stripped. Teams need values.mesh.annotations. Not shipped. Same family of bug later dropped notifications worker.concurrency."
  },
  {
    "kind": "resolution",
    "topic": "actions-minutes",
    "title": "Cancel the leftover rebuild-images workflow",
    "body": "Monday 10:40. payments-api main was red because the integration job sat pending 26 minutes. Runners were busy, not failed. Sunday workflow_dispatch rebuild images was left running with no timeout and burned the included minutes. Priya said cancel it and do not buy more minutes. Cancelling does not refund minutes already billed. She will PR a 60 minute timeout. That timeout was still not in at Friday handoff."
  },
  {
    "kind": "contact",
    "topic": "actions-minutes",
    "title": "Priya Shah",
    "body": "CI runners contact for the GitHub-hosted minutes burn.",
    "contactName": "Priya Shah",
    "contactChannel": "Slack @priya in #ci-runners"
  },
  {
    "kind": "url",
    "topic": "actions-minutes",
    "title": "payments-api Actions",
    "body": "Actions page for the pending integration job.",
    "url": "https://github.com/example-org/payments-api/actions"
  },
  {
    "kind": "cheat",
    "topic": "actions-minutes",
    "title": "Cancel rebuild images from the UI",
    "body": "Org settings, Actions. The running workflow is rebuild images, actor sam. Cancel from the UI. The CI token cannot cancel another user's run."
  },
  {
    "kind": "known_issue",
    "topic": "actions-minutes",
    "title": "Cancel does not refund Actions minutes",
    "body": "Cancelling stops the bleed. It does not free minutes already billed."
  },
  {
    "kind": "contact",
    "topic": "actions-pinning",
    "title": "Jonah Peck",
    "body": "Security owner of the pin-actions-to-sha argument. Devs hate the Renovate noise. Not agreed on Monday.",
    "contactName": "Jonah Peck",
    "contactChannel": "Slack @jonah in #supply-chain"
  },
  {
    "kind": "doc",
    "topic": "actions-pinning",
    "title": "Actions pinning doc",
    "body": "Jonah's writeup. Tags move. Compromise on the table: pin sha, Renovate groups updates weekly, one PR per repo on Monday. Nico offered a shared composite action so teams pin one sha.",
    "url": "https://intranet.example.com/docs/actions-pinning"
  },
  {
    "kind": "known_issue",
    "topic": "actions-pinning",
    "title": "SHA pinning is a pilot, not a policy",
    "body": "As of Friday 17 Oct this is still open. Pilot is payments-api plus the chart repo, weekly grouped Renovate, starting Monday 20 Oct. Jonah and Nico. Not a policy for every repo."
  },
  {
    "kind": "resolution",
    "topic": "portal-samesite",
    "title": "Set SameSite=None and Secure together",
    "body": "Monday 13:20 user report. Merchant portal sometimes logs people out. Not payments-api. Portal BFF cookie SameSite flipped Friday. Chrome was strict, Firefox still worked. Dana said do not revert: the old cookie missed Secure on one path. Fix is SameSite=None and Secure together. PR 4412 merged 13:58. Users need a hard refresh. Do not tell support to clear all cookies.",
    "steps": [
      "Ship SameSite=None and Secure together",
      "Tell support to hard-refresh, not clear all cookies"
    ]
  },
  {
    "kind": "contact",
    "topic": "portal-samesite",
    "title": "Dana Okonkwo",
    "body": "Portal oncall for the logout cookie bug.",
    "contactName": "Dana Okonkwo",
    "contactChannel": "Slack @dana in #merchant-portal"
  },
  {
    "kind": "url",
    "topic": "portal-samesite",
    "title": "Portal cookie PR 4412",
    "body": "Merged pull request for the SameSite and Secure cookie fix.",
    "url": "https://github.com/example-org/merchant-portal/pull/4412"
  },
  {
    "kind": "doc",
    "topic": "portal-samesite",
    "title": "Cookie policy",
    "body": "Cookie policy Dana pointed at.",
    "url": "https://intranet.example.com/docs/cookie-policy"
  },
  {
    "kind": "known_issue",
    "topic": "portal-samesite",
    "title": "IMPERSONATE cookie was not updated",
    "body": "The admin impersonation cookie IMPERSONATE was not updated with the SameSite change. Follow-up PLAT-1884. If impersonation looks broken, it is this, not Auth0. Still open at Wednesday handoff."
  },
  {
    "kind": "resolution",
    "topic": "tf-state-lock",
    "title": "Force-unlock Sam's stale laptop lock",
    "body": "Monday 14:10. Prod network stack plan was locked by Sam's own Saturday laptop apply that never finished. He force-unlocked only after the Dynamo holder was himself. Unlocked 14:22. No apply. The CIDR change is not in prod. He will re-plan Tuesday with a buddy.",
    "contactName": "Sam Ibarra",
    "contactChannel": "Slack @sam in #infra-terraform"
  },
  {
    "kind": "contact",
    "topic": "tf-state-lock",
    "title": "Sam Ibarra",
    "body": "Terraform contact for the prod network state lock.",
    "contactName": "Sam Ibarra",
    "contactChannel": "Slack @sam in #infra-terraform"
  },
  {
    "kind": "doc",
    "topic": "tf-state-lock",
    "title": "Terraform state lock runbook",
    "body": "Runbook for a stuck Terraform lock.",
    "url": "https://intranet.example.com/runbooks/tf-state-lock"
  },
  {
    "kind": "cheat",
    "topic": "tf-state-lock",
    "title": "Confirm the lock holder before force-unlock",
    "body": "terraform force-unlock only after the holder is visible in Dynamo table tf-locks-prod, region us-east-1. Do not unlock a lock from a CI apply that is still running."
  },
  {
    "kind": "known_issue",
    "topic": "tf-state-lock",
    "title": "A slept laptop leaves the lock row",
    "body": "The lock row can outlive the process if the laptop slept. The apply is dead. The row is not."
  },
  {
    "kind": "resolution",
    "topic": "otel-debug-cost",
    "title": "Turn collector debug off and tail-sample",
    "body": "Monday FinOps: cloud cost up 18% week over week from logging, not compute. config.debug was left on in the otel collector for the gateway-api mesh experiment. Mei will tail-sample 10% with errors always. Nico signed off. Not done at Monday handoff. Wednesday 08:00 check: config.debug is false, tail sampling is on, error traces kept, the rest at 10%. The cost channel lags a day, so do not declare victory yet.",
    "steps": [
      "Set config.debug false in deploy/observability/collector-values.yaml",
      "Tail-sample 10% and always keep errors"
    ]
  },
  {
    "kind": "contact",
    "topic": "otel-debug-cost",
    "title": "Mei Chen",
    "body": "Observability owner of the collector debug flag and the gateway-api trace experiment.",
    "contactName": "Mei Chen",
    "contactChannel": "Slack @mei in #observability"
  },
  {
    "kind": "doc",
    "topic": "otel-debug-cost",
    "title": "Otel sampling doc",
    "body": "Sampling doc. Do not rip the collector out. She still needs the gateway canary traces.",
    "url": "https://intranet.example.com/docs/otel-sampling"
  },
  {
    "kind": "cheat",
    "topic": "otel-debug-cost",
    "title": "config.debug is the flag that works",
    "body": "The flag is deploy/observability/collector-values.yaml key config.debug, not the env DEBUG. The env one does nothing now."
  },
  {
    "kind": "resolution",
    "topic": "nat-port-exhaustion",
    "title": "Cut payments-api retries from 8 to 3 with jitter",
    "body": "Monday 16:40. Four minute internal egress blip. Sanction-list vendor was green. Our NAT gateway ran out of ports. payments-api retries had no jitter, 8 times. Ravi wants 3 retries with jitter. Code change, not a firewall change. Ticket PAY-2201, payments team, assignee unknown. Not described as done later in the week.",
    "contactName": "Ravi Patel",
    "contactChannel": "Slack @ravi in #net-help"
  },
  {
    "kind": "contact",
    "topic": "nat-port-exhaustion",
    "title": "Ravi Patel",
    "body": "Network contact for NAT port exhaustion. Priya said not to ping her for this.",
    "contactName": "Ravi Patel",
    "contactChannel": "Slack @ravi in #net-help"
  },
  {
    "kind": "url",
    "topic": "nat-port-exhaustion",
    "title": "NAT ports board",
    "body": "Board used during the egress blip.",
    "url": "https://grafana.example.com/d/nat-ports"
  },
  {
    "kind": "doc",
    "topic": "nat-port-exhaustion",
    "title": "NAT port exhaustion runbook",
    "body": "Half-written draft runbook.",
    "url": "https://intranet.example.com/runbooks/nat-port-exhaustion"
  },
  {
    "kind": "known_issue",
    "topic": "nat-port-exhaustion",
    "title": "A second NAT gateway does not fix retries",
    "body": "Adding a second NAT gateway without the client retry fix only moves the cliff. That was already done in May. Do not propose it again in the incident channel."
  },
  {
    "kind": "resolution",
    "topic": "grafana-internal-cert",
    "title": "Point Grafana at step-ca-internal and roll it",
    "body": "Tuesday 07:55. Internal ingress cert for grafana.example.com, not the public cert. cert-manager was stuck because the ingress was annotated cluster-issuer letsencrypt-prod during the golden path trial. That issuer cannot see private DNS. Otto: delete that annotation, set issuer step-ca-internal, delete the failed Certificate and the secret grafana-tls in namespace observability so it reorders, then roll Grafana after the new secret is Ready. Fixed 08:37. Cert valid through 12 Jan 2027.",
    "steps": [
      "Remove cert-manager.io/cluster-issuer letsencrypt-prod",
      "Set the issuer to step-ca-internal",
      "Delete the failed Certificate and secret grafana-tls in namespace observability",
      "Roll the Grafana deploy after the new secret is Ready"
    ]
  },
  {
    "kind": "contact",
    "topic": "grafana-internal-cert",
    "title": "Otto Berg",
    "body": "Internal CA owner. Leila Ortiz was also on this page.",
    "contactName": "Otto Berg",
    "contactChannel": "Slack @otto in #pki"
  },
  {
    "kind": "doc",
    "topic": "grafana-internal-cert",
    "title": "Internal certs runbook",
    "body": "Internal certificate runbook. The 30 day alert pages #pki, not #oncall, which is why it was missed. Otto will add #oncall. Not done Tuesday morning.",
    "url": "https://intranet.example.com/runbooks/internal-certs"
  },
  {
    "kind": "cheat",
    "topic": "grafana-internal-cert",
    "title": "waiting for dns on a private name means the wrong issuer",
    "body": "kubectl -n observability describe certificate grafana-tls and read the Failed status. waiting for dns on a private name means the wrong issuer. It is not a Route53 problem."
  },
  {
    "kind": "known_issue",
    "topic": "grafana-internal-cert",
    "title": "Grafana keeps the expired cert until it rolls",
    "body": "Deleting the secret while an old pod still mounts it leaves Grafana on the expired cert until the deploy is rolled. Roll only after the new secret is Ready."
  },
  {
    "kind": "known_issue",
    "topic": "gateway-api-canary",
    "title": "Gateway API has no cutover date",
    "body": "Mei wants to stop writing ingress yaml. Istio ingress stays for now. One canary host, shop.example.com, is on Gateway API. Nico says no second migration while the golden path chart is open. Mei says the ingress annotation mess is why Grafana hit Let's Encrypt. No date. Thread #service-mesh. Still open Friday."
  },
  {
    "kind": "contact",
    "topic": "gateway-api-canary",
    "title": "Mei Chen",
    "body": "Pushing Gateway API. Nico Alvarez is the hold.",
    "contactName": "Mei Chen",
    "contactChannel": "Slack @mei in #service-mesh"
  },
  {
    "kind": "known_issue",
    "topic": "oncall-ownership",
    "title": "Synthetics paging is not decided",
    "body": "Ravi's proposal: platform takes sev pages for kube-system, observability, ingress, and ci. Product keeps app 5xx. The fight is synthetics. Leila says they are hers. Product says a bad synthetic wakes them. Proposal is to page the owning team label, after Monday's robot secret fix. Still open Friday."
  },
  {
    "kind": "known_issue",
    "topic": "renovate-grouping",
    "title": "Weekly grouped Renovate is a two-repo pilot",
    "body": "Tuesday: 40 Renovate PRs overnight, people close them unread. Jonah says that is how surprises happen. Nico will pilot weekly grouped PRs on payments-api and the chart repo only, starting the following Monday. Not all repos. Friday note matches that: pilot starts Monday 20 Oct."
  },
  {
    "kind": "resolution",
    "topic": "postgres-mirror-pull",
    "title": "Point the test at the ECR postgres mirror",
    "body": "Tuesday 10:05 staging only. payments-api ImagePullBackOff, toomanyrequests from Docker Hub, because a test compose copied from a blog used postgres:16. Priya: use 123456789.dkr.ecr.us-east-1.amazonaws.com/mirror/postgres:16. PR 3890 merged 10:41. The mirror only copies tags listed in mirror-images.txt. Floating postgres:16 will go stale. Pin 16.4. That pin was not done, only a PR comment.",
    "url": "https://github.com/example-org/payments-api/pull/3890"
  },
  {
    "kind": "contact",
    "topic": "postgres-mirror-pull",
    "title": "Priya Shah",
    "body": "CI contact for the Docker Hub rate limit.",
    "contactName": "Priya Shah",
    "contactChannel": "Slack @priya in #ci-runners"
  },
  {
    "kind": "cheat",
    "topic": "postgres-mirror-pull",
    "title": "429 is Docker Hub, 403 is IAM",
    "body": "Read the registry host in the error. toomanyrequests or 429 is Docker Hub. ECR 403 means the node role lost ecr:GetAuthorizationToken. Do not rotate IAM for a Docker Hub 429."
  },
  {
    "kind": "known_issue",
    "topic": "postgres-mirror-pull",
    "title": "The postgres mirror does not track floating tags",
    "body": "The mirror job only copies tags listed in mirror-images.txt. postgres:16 will go stale. Pin 16.4 in the test."
  },
  {
    "kind": "resolution",
    "topic": "rds-restore-drill",
    "title": "Size the drill instance only for the apply window",
    "body": "Tuesday 11:30 scheduled drill. Restore of payments-ledger into the drill account timed out during WAL apply and was cancelled after 2 hours. The snapshot is fine. The drill RDS class is smaller than prod. Helen said do not just grow the drill instance. Use the same class for the apply window, then scale down. Ticket DATA-774. She will do it. A failed drill does not mean there is no backup.",
    "contactName": "Helen Cho",
    "contactChannel": "Slack @helen in #data-platform"
  },
  {
    "kind": "contact",
    "topic": "rds-restore-drill",
    "title": "Helen Cho",
    "body": "Data oncall for the payments ledger restore drill.",
    "contactName": "Helen Cho",
    "contactChannel": "Slack @helen in #data-platform"
  },
  {
    "kind": "doc",
    "topic": "rds-restore-drill",
    "title": "RDS restore drill runbook",
    "body": "Latest automated snapshot checked was payments-ledger-prod at 14 Oct 06:11 UTC.",
    "url": "https://intranet.example.com/runbooks/rds-restore-drill"
  },
  {
    "kind": "cheat",
    "topic": "rds-restore-drill",
    "title": "List the automated ledger snapshots",
    "body": "aws rds describe-db-snapshots --db-instance-identifier payments-ledger-prod --snapshot-type automated. Latest seen in the note was 14 Oct 06:11 UTC."
  },
  {
    "kind": "known_issue",
    "topic": "rds-restore-drill",
    "title": "Drill box cannot see Grafana",
    "body": "The drill security group does not allow the restore box to reach Grafana, so apply lag is only visible on the box. Helen has bastion SSH. Do not restart the drill just to watch it."
  },
  {
    "kind": "resolution",
    "topic": "charge-idempotency-test",
    "title": "Rerun the test; prefix the redis key with the run id",
    "body": "Tuesday 13:45. payments-api TestChargeIdempotency failed twice and passed on rerun. Shared redis key prefix charge:test has no build id, and another job flushed it. Not a customer issue. Marco will prefix the key with GITHUB_RUN_ID. Reran green at 14:28. The fix was not in that night. Issue 3894.",
    "url": "https://github.com/example-org/payments-api/issues/3894"
  },
  {
    "kind": "contact",
    "topic": "charge-idempotency-test",
    "title": "Marco Velez",
    "body": "Author of the flaky charge idempotency test.",
    "contactName": "Marco Velez",
    "contactChannel": "Slack @marco in #payments-dev"
  },
  {
    "kind": "resolution",
    "topic": "pdb-node-drain",
    "title": "Scale payments-api to 3 before draining",
    "body": "Tuesday 15:10. A NotReady node could not drain. payments-api PDB minAvailable 2, and only 2 replicas were on that pool because the other pool was cordoned for a kernel bump. Ravi said do not delete the PDB. Scale to 3, let one land on the good pool, then drain. No customer impact. The other replica was up. Thursday 08:30 Ravi uncordoned, drain completed, disruptionsAllowed is 1 again. The kernel bump moved to next week.",
    "contactName": "Ravi Patel",
    "contactChannel": "Slack @ravi in #net-help"
  },
  {
    "kind": "cheat",
    "topic": "pdb-node-drain",
    "title": "Find PDBs with no disruptions left",
    "body": "kubectl get pdb -A and compare desired and allowed. The awk '$3==$4' check is the ones with disruptionsAllowed 0."
  },
  {
    "kind": "known_issue",
    "topic": "pdb-node-drain",
    "title": "Kernel bump slipped a week",
    "body": "The pool cordon was for a kernel bump. Thursday it was uncordoned and the NotReady node rejoined, but the kernel bump is not done. Ravi moved it to the following week."
  },
  {
    "kind": "resolution",
    "topic": "shop-gateway-drift",
    "title": "Ignore the Argo tracking annotation and sync",
    "body": "Tuesday 16:00. Argo app shop-gateway was OutOfSync. The diff was argocd.argoproj.io/tracking-id, which Argo writes itself. An earlier sync wave had failed on an unrelated CRD. Mei ignored the annotation in the compare options, edited the app project, and synced. Healthy at 16:22.",
    "contactName": "Mei Chen",
    "contactChannel": "Slack @mei in #service-mesh"
  },
  {
    "kind": "doc",
    "topic": "shop-gateway-drift",
    "title": "Argo ignore-differences doc",
    "body": "How to ignore the tracking-id annotation.",
    "url": "https://intranet.example.com/docs/argocd-ignore-differences"
  },
  {
    "kind": "known_issue",
    "topic": "shop-gateway-drift",
    "title": "sync --force recreates the gateway",
    "body": "sync --force on shop-gateway recreates the gateway and drops canary traffic for about a minute. Do not do that."
  },
  {
    "kind": "resolution",
    "topic": "payments-idempotency-prefix",
    "title": "Roll back to a1c90ee, then default the prefix in code",
    "body": "Wednesday 15 Oct. The only production outage of the week. payments-api error rate 6% from 08:11 to 08:18 UTC. Marco's idempotency prefix deploy expected IDEMPOTENCY_REDIS_PREFIX and it was unset, so the empty prefix collided with another service on the same redis. New charge ids were rejected as already processed. About 140 checkout posts rejected. No double charge. Helen confirmed no ledger dupes. Rollback was Argo history to sha a1c90ee, not a live patch. Follow-up PR 3902 defaults the prefix to the service name, merged 11:05, redeployed, error rate normal. Thursday morning the error rate was flat and support did not see the stale message. Thursday 15:15 the prefix-default deploy was watched in prod and did not move error rate or p99.",
    "steps": [
      "Roll back payments-api in Argo to sha a1c90ee",
      "Do not patch the live deployment",
      "Ship the code default for the redis prefix"
    ],
    "url": "https://github.com/example-org/payments-api/pull/3902"
  },
  {
    "kind": "contact",
    "topic": "payments-idempotency-prefix",
    "title": "Marco Velez",
    "body": "Confirmed the rollback. Asha Rahman watched the Argo sync and did not drive. Helen Cho confirmed no ledger duplicates.",
    "contactName": "Marco Velez",
    "contactChannel": "Slack @marco in #payments-dev"
  },
  {
    "kind": "doc",
    "topic": "payments-idempotency-prefix",
    "title": "Payments rollback runbook",
    "body": "Open this first next time. Incident stub for Friday 16:00 postmortem. Nico wants it short. Attendees Marco, Helen, the note author, Asha optional.",
    "url": "https://intranet.example.com/runbooks/payments-rollback"
  },
  {
    "kind": "url",
    "topic": "payments-idempotency-prefix",
    "title": "Idempotency incident stub",
    "body": "Postmortem doc. Friday 16:00. Agreed action, not implemented: the chart should fail the pod if a new required setting is missing, instead of env-only config.",
    "url": "https://intranet.example.com/incidents/2026-10-15-idempotency-prefix"
  },
  {
    "kind": "cheat",
    "topic": "payments-idempotency-prefix",
    "title": "Check Argo is not mid-sync before rollback",
    "body": "argocd app get payments-api --show-operation shows a sync in flight. Do not roll back while a sync is running."
  },
  {
    "kind": "known_issue",
    "topic": "payments-idempotency-prefix",
    "title": "Stale redis keys until Thursday 08:18 UTC",
    "body": "Bad keys stay until the 24h ttl. A retry of a charge that failed during the 7 minutes can still look already processed. Marco said the key includes a date, so after Thursday 08:18 UTC it is a new bug. Support macro during the incident: retry, the duplicate message was wrong."
  },
  {
    "kind": "contact",
    "topic": "golden-path-template",
    "title": "Nico Alvarez",
    "body": "Backstage is a client. The golden path template is the source of truth. Fix the template, not Backstage. The create-service button still emits the old ingress annotation that sent Grafana to Let's Encrypt. Otto is annoyed. Required-env check is chart backlog, not this week. Template repo is https://github.com/example-org/golden-path-template",
    "contactName": "Nico Alvarez",
    "contactChannel": "Slack @nico in #devex"
  },
  {
    "kind": "resolution",
    "topic": "api-dns-blip",
    "title": "Wait if only one resolver fails",
    "body": "Wednesday 11:50. api.example.com SERVFAIL from 1.1.1.1 only, not from 8.8.8.8. Route53 was fine. Cloudflare DNS showed degraded and recovered while the note was being typed. Ravi: if both resolvers fail, check our zone. If only one fails, wait 5 minutes before touching Route53. No change made.",
    "contactName": "Ravi Patel",
    "contactChannel": "Slack @ravi in #net-help"
  },
  {
    "kind": "url",
    "topic": "api-dns-blip",
    "title": "Multi-resolver DNS board",
    "body": "Use this probe, not the oncall phone.",
    "url": "https://grafana.example.com/d/dns-multi"
  },
  {
    "kind": "known_issue",
    "topic": "api-dns-blip",
    "title": "The oncall phone caches DNS longer",
    "body": "The corp resolver on the phone still failed for 3 minutes after public DNS was fine. Do not use the phone as the probe."
  },
  {
    "kind": "resolution",
    "topic": "flag-timeout-defaults",
    "title": "Revert the flag SDK sidecar",
    "body": "Wednesday 13:00. flags.internal p99 was 800ms. Not down. Checkout timed out the flag read and used the default, which is new tax off, so staging under-collected tax. Prod timeout is higher and did not trip. Stefan reverted a bad flag SDK cache rollout. p99 back to 40ms at 13:22.",
    "contactName": "Stefan Vogel",
    "contactChannel": "Slack @stefan in #flags"
  },
  {
    "kind": "contact",
    "topic": "flag-timeout-defaults",
    "title": "Dana Okonkwo",
    "body": "Dana owns the flag client. Stefan Vogel owns the flag service.",
    "contactName": "Dana Okonkwo",
    "contactChannel": "Slack @dana in #merchant-portal"
  },
  {
    "kind": "doc",
    "topic": "flag-timeout-defaults",
    "title": "Flag timeout defaults",
    "body": "The client default is flags/defaults.json in the repo, not the flag UI. The UI can say tax on while the timeout default says off.",
    "url": "https://intranet.example.com/docs/flag-timeout-defaults"
  },
  {
    "kind": "cheat",
    "topic": "flag-timeout-defaults",
    "title": "Read flags/defaults.json before arguing with finance",
    "body": "Timeout default lives in flags/defaults.json. Do not trust the flag UI alone when a read times out."
  },
  {
    "kind": "known_issue",
    "topic": "flag-timeout-defaults",
    "title": "Staging and prod defaults have drifted",
    "body": "Staging defaults.json has two keys prod does not. Stefan filed FLAG-90. Not fixed Wednesday. Still on the Wednesday open list."
  },
  {
    "kind": "resolution",
    "topic": "otel-debug-header",
    "title": "Drop the debug_session header at the gateway collector",
    "body": "Wednesday 14:30. Otel gateway node disk hit 85%. Not the debug flag. Merchant 44821 was sending 200kb payloads in a header from a forgotten debug session. Mei dropped attribute http.request.header.debug_session on the gateway collector. Disk flattening by 15:10.",
    "contactName": "Mei Chen",
    "contactChannel": "Slack @mei in #observability"
  },
  {
    "kind": "known_issue",
    "topic": "otel-debug-header",
    "title": "The daemonset still buffers the header for 15 minutes",
    "body": "The drop rule is on the gateway collector only. The daemonset still writes the header to node-local disk for about 15 minutes. If the node alert stays, the buffer is draining. It is not a failed fix."
  },
  {
    "kind": "resolution",
    "topic": "runner-clock-skew",
    "title": "Rebuild the self-hosted runner image with chrony",
    "body": "Wednesday 15:40. A release job's cosign attestation said the cert was from the future. The self-hosted runner clock was 6 minutes fast. NTP was not running in that image. GitHub-hosted runners were fine. This job is pinned to self-hosted because it needs the corp net. Priya rebuilt the image with chrony. Signs after 16:20 were fine. Image ghcr.io/example-org/runner:2026.10.15.",
    "contactName": "Priya Shah",
    "contactChannel": "Slack @priya in #ci-runners"
  },
  {
    "kind": "doc",
    "topic": "runner-clock-skew",
    "title": "Self-hosted runners runbook",
    "body": "Priya added the clock note at the bottom of the runbook.",
    "url": "https://intranet.example.com/runbooks/self-hosted-runners"
  },
  {
    "kind": "cheat",
    "topic": "runner-clock-skew",
    "title": "Do not retry a sign while NTP is unsynced",
    "body": "On the runner, timedatectl show -p NTPSynchronized. If it is no, wait for the new image. Another sign produces another bad attestation."
  },
  {
    "kind": "resolution",
    "topic": "catalog-import-waf",
    "title": "Scope down the SQLi rule on catalog import",
    "body": "Wednesday 16:30 prod, low volume. Merchant bulk upload POST /v1/catalog/import is a CSV. WAF managed SQLi rule blocked 12 requests because a product title had a quote and a semicolon. Clients got 403 HTML and retries looked like a spike. Jonah added a scope-down on that path for the SQLi rule group only. Other rules still apply. It was a console change. Thursday his Terraform PR merged, the pipeline hold was removed, and the plan showed no diff. SEC-551 can close only after he says so.",
    "contactName": "Jonah Peck",
    "contactChannel": "Slack @jonah in #supply-chain"
  },
  {
    "kind": "known_issue",
    "topic": "catalog-import-waf",
    "title": "The WAF console edit can drift from Terraform",
    "body": "Wednesday night a Terraform apply from main could have reverted the console scope-down. Jonah put a hold on the WAF Terraform pipeline until his PR. Thursday the hold was gone and plan matched the console. The WAF console is in the security account, not the app account."
  },
  {
    "kind": "contact",
    "topic": "gpu-batch-account",
    "title": "Helen Cho",
    "body": "Ledger asked for a GPU node in the main cluster for a batch job. Nico said no. GPUs there are for the recs team and they are full. Use the existing batch account. Helen is the batch contact.",
    "contactName": "Helen Cho",
    "contactChannel": "Slack @helen in #data-platform",
    "url": "https://intranet.example.com/docs/batch-account"
  },
  {
    "kind": "doc",
    "topic": "kaniko-template",
    "title": "Kaniko template",
    "body": "Notifications asked to mount the docker socket in a build pod. Priya said no three times. Use the kaniko template.",
    "url": "https://intranet.example.com/docs/kaniko-template",
    "contactName": "Priya Shah",
    "contactChannel": "Slack @priya in #ci-runners"
  },
  {
    "kind": "known_issue",
    "topic": "release-break-glass",
    "title": "Hotfix goes through break-glass, not unlocking main",
    "body": "Thursday office hours. Someone asked to turn off branch protection for a hotfix. The answer is #release-break-glass, two acks, Nico and the app owner. It was not used that day."
  },
  {
    "kind": "resolution",
    "topic": "debug-dumps-lifecycle",
    "title": "Correct the readme; the dump is gone",
    "body": "Thursday 10:20. A heap dump under s3://debug-dumps-staging/payments-api/ disappeared. Lifecycle expires objects at 3 days. The author thought it was 30 days. The rule changed in August. The readme was wrong. Sam will not extend the lifecycle because dumps can contain customer payloads. Readme fix is platform-docs PR 220. Lifecycle does not restore deleted objects. The bucket is not versioned on purpose.",
    "url": "https://github.com/example-org/platform-docs/pull/220",
    "contactName": "Sam Ibarra",
    "contactChannel": "Slack @sam in #infra-terraform"
  },
  {
    "kind": "known_issue",
    "topic": "deploy-quiet-window",
    "title": "The 16:00-18:00 deploy window is not a pipeline gate",
    "body": "Nico wants a social quiet window 16:00-18:00 local so oncall is not solo. It would not have caught the Wednesday 08:11 UTC idempotency incident. Asha said the window is theater unless the chart has a required-env check. Nico agreed the check matters more. Do not tell a team the pipeline will block them. It will not. Still open Friday."
  },
  {
    "kind": "resolution",
    "topic": "emails-retry-concurrency",
    "title": "Put worker.concurrency back to 20",
    "body": "Thursday 12:30. Rabbit queue emails-retry climbed to 80k. Not paged. A golden path migration dropped the override, so worker.concurrency fell from 20 to the chart default of 1. Bea put 20 back. Queue drained by 13:40. Same family of bug as the stripped sidecar annotation.",
    "contactName": "Bea Santos",
    "contactChannel": "Slack @bea in #notifications",
    "steps": [
      "Set worker.concurrency to 20 in the notifications values",
      "Do not raise it to 100 to drain faster"
    ]
  },
  {
    "kind": "known_issue",
    "topic": "emails-retry-concurrency",
    "title": "Concurrency 100 flooded the mail vendor before",
    "body": "20 is the tuned number. In June, concurrency 20 with the old prefetch flooded the mail vendor. Do not set 100 to drain faster. The vendor limit is in Bea's channel canvas, not a URL in the note."
  },
  {
    "kind": "resolution",
    "topic": "slack-budget-webhook",
    "title": "Add the in-cluster slack secret to the rotation manifest",
    "body": "Thursday 14:00 scheduled rotation. IAM rotated the budget-alert Slack webhook. The lambda env was updated. A second copy in namespace observability, secret slack-budget, key url, was not in infra/rotation/manifest.yaml. Lambda alerts still arrived. In-cluster budget alerts stopped. Sam's PR 1502 adds the secret to the manifest and is not merged as of the Friday handoff. The note deliberately does not contain the webhook URL.",
    "url": "https://github.com/example-org/infra/pull/1502",
    "contactName": "Sam Ibarra",
    "contactChannel": "Slack @sam in #infra-terraform"
  },
  {
    "kind": "contact",
    "topic": "slack-budget-webhook",
    "title": "Mei Chen",
    "body": "Mei owns the in-cluster notifier. Sam owns which secrets the rotation script knows about.",
    "contactName": "Mei Chen",
    "contactChannel": "Slack @mei in #observability"
  },
  {
    "kind": "cheat",
    "topic": "slack-budget-webhook",
    "title": "Budget alerts have two senders",
    "body": "If Slack budget alerts stop, check the lambda and the in-cluster notifier before rotating again. A second rotation invalidates the first URL and then both are wrong."
  },
  {
    "kind": "known_issue",
    "topic": "slack-budget-webhook",
    "title": "An old values file can still hold a live webhook",
    "body": "A webhook left in git history of an old values file stays valid until Slack regenerates it. Jonah wants that file purged. Not done Thursday. Do not paste the URL into notes."
  },
  {
    "kind": "resolution",
    "topic": "buildkit-memory",
    "title": "Set the buildkit memory limit to 8Gi",
    "body": "Thursday 16:40 staging only. Buildkit had no memory limit, OOMKilled, and took the node. Staging deploys queued. Not prod. Priya set limits.memory to 8Gi. The pod came back and the queue cleared at 17:05. The monorepo image build peaked at 7.1Gi, so 8Gi is a guess. She filed CI-640 to split the build. Omar had already seen this by Friday morning.",
    "contactName": "Priya Shah",
    "contactChannel": "Slack @priya in #ci-runners"
  },
  {
    "kind": "known_issue",
    "topic": "week-open-decisions",
    "title": "Decisions still open on Friday 17 Oct",
    "body": "Still open: actions SHA pinning is a Monday 20 Oct pilot on payments-api and the chart repo only. Gateway API has no cutover date. The 16:00-18:00 deploy window is social, not enforced. Synthetics paging waits on Leila's label work. Required env in the chart is backlog and would have caught IDEMPOTENCY_REDIS_PREFIX. GPUs stay out of the main cluster. Infra PR 1502 for the rotation manifest is not merged. Golden path still drops overrides. Do not buy more GitHub Actions minutes. Otel debug is already off, and the FinOps number lags."
  }
]
```

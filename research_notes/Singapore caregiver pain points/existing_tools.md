# Existing Digital Tools for Singapore Eldercare Navigation: Competitor and Landscape Analysis (as of 24 Nov 2026)

Method note: SupportGoWhere and the AIC tools are JavaScript apps that did not render for the fetch tool, so the exact question flows of the Care Services Recommender (CSR) could not be read directly. Findings on them come from official snippets, AIC FAQs and secondary posts. Treat field-level claims about the CSR as "reported", not "observed".

## 1. AIC Care Services Recommender and SupportGoWhere: what they ask, what they return

### Takeaway
The government's main navigator is the Care Services Recommender, built by AIC with ServiceSG and GovTech and hosted on SupportGoWhere (LifeSG family). It asks a short questionnaire and returns matching service types and schemes, with per-service pages covering eligibility, referral needs and "fees apply / means-tested" wording. No source shows it giving a personalised cost estimate, real provider availability or waitlists, or a step-by-step action plan.

### Cited Findings
- aic.sg promotes the tool on its homepage ("Need Care Options for Your Loved One? Try the Care Services Recommender") and sends users to SupportGoWhere to find community care services in their neighbourhood. — [aic.sg](https://aic.sg/); [AIC CSR page](https://aic.sg/Care-Services-Recommender)
- AIC's FAQ confirms the CSR lives on the SupportGoWhere website, not on aic.sg. — [ask.gov.sg AIC FAQ](https://ask.gov.sg/aic/questions/cls1kszwh00f81cod11ws1t49)
- SupportGoWhere says an "updated Care Services Recommender (CSR) is now available": users "answer a few questions and get recommendations based on your caregiving needs". — [SupportGoWhere caregiving](https://supportgowhere.life.gov.sg/caregiving); [Support Recommender](https://supportgowhere.life.gov.sg/caregiving/support-recommender)
- AIC built the CSR with ServiceSG and GovTech to help caregivers "correctly identify the appropriate service or scheme" for seniors in their care. A 2022-era post says it covered 20+ care services and 15+ financial schemes (may be outdated). — [AIC LinkedIn](https://sg.linkedin.com/posts/agency-for-integrated-care-singapore_supportgowhere-activity-7001469263945363456-31qw); [AIC blog](https://www.aic-blog.com/new-caregiving-heres-how-you-can-find-support-and-help)
- SupportGoWhere's Support Recommenders tell users about their *potential* eligibility for schemes and services after a few questions. The caregiver version covers physical and mental healthcare, social support, financial assistance, future planning and caregiving resources. — [OpenGov Asia, 2023](https://opengovasia.com/2023/04/26/exclusive-supportgowhere-simplifying-access-to-government-assistance-schemes-and-services/)
- Service pages linked from the CSR (search snippets): Nursing Home ("referral is required, and fees apply"; for a senior "unable to be cared for at home by family or paid domestic worker, and has tried all other care options"), Nursing Home Respite, Maintenance Day Care, Dementia Day Care, Day Hospice, Home Nursing. The snippets say subsidies are means-tested and many apply only to citizens and PRs, and give the AIC hotline 1800 650 6060. — [Nursing Home](https://supportgowhere.life.gov.sg/services/SVC-NH/nursing-home); [NH Respite](https://supportgowhere.life.gov.sg/services/SVC-NHRC/nursing-home-respite-care); [Maintenance Day Care](https://supportgowhere.life.gov.sg/services/SVC-MDCC/maintenance-day-care-centre); [Dementia Day Care](https://supportgowhere.life.gov.sg/services/SVC-DDC/dementia-day-care); [Day Hospice](https://supportgowhere.life.gov.sg/services/SVC-PDC/day-hospice-care); [Home Nursing](https://supportgowhere.life.gov.sg/services/SVC-HN/home-nursing)
- DementiaHub.SG points users to the CSR "to find service providers near you", which suggests the results link to a provider locator. — [DementiaHub.SG](https://www.dementiahub.sg/dementia/programmes-and-services/)
- CPF tells caregivers to use SupportGoWhere to check which schemes they qualify for. It lists the AIC schemes as Home Caregiving Grant, PGDAS, IDAPE, ElderFund, MediSave Care, CareShield Life and ElderShield, all aimed at people with permanent moderate to severe disability. — [CPF InfoHub](https://cpf.gov.sg/member/infohub/educational-resources/government-support-available-for-caregivers)
- The AIC hotline runs Mon to Fri, 8:30am to 8:30pm. — [aic.sg](https://aic.sg/)

### Inferences
- The CSR answers "which service type might fit" and "which schemes might I qualify for". It stops before "what will this cost my family after subsidy", "which centre near me has a place", and "what do I do Monday morning". Cost wording ("fees apply", "means-tested") is generic, not personalised.
- Eligibility is only "potential". The real gates (referrals, means test, Functional Assessment Report) still happen offline through hospitals, GPs or AIC.

### Gaps
- The exact CSR questions (age, ADL needs, diagnosis, living arrangement, income?) could not be confirmed because the page did not render. Recommend a manual walk-through.
- No public user reviews, satisfaction scores or usage numbers for the CSR were found.
- No evidence was found that SupportGoWhere has a caregiving chatbot. Not confirmed either way.

## 2. Other government channels: AIC e-services, Silver Pages, HealthHub, LifeSG, hotline, apps

### Takeaway
Government information is spread across many overlapping places: aic.sg, Singapore Silver Pages/E-Care Locator, SupportGoWhere, HealthHub, LifeSG, MSF pages, hospital portals and a hotline. Each covers one slice. Whether Silver Pages has been merged into aic.sg could not be confirmed.

### Cited Findings
- Singapore Silver Pages (silverpages.sg, run by AIC) was launched as a one-stop eldercare portal bringing together social care, healthcare and caregiving resources. Its E-Care Locator searches eldercare facilities and services. — [MOH speech, SSP v2.0 launch 2013](https://www.moh.gov.sg/newsroom/speech-by-dr-amy-khor-minister-of-state-for-health-and-manpower-at-the-official-launch-of-singapore-silver-pages-(ssp)-v20-28-july-2013-at-the-icare-carnival-2013/); [ask.gov.sg AIC FAQ](https://ask.gov.sg/aic/questions/cls1kszwl00hs1codej46s2tl)
- An Eldercare Services dataset (locations) is published on data.gov.sg, which makes an open dataset usable for a third-party map. — [data.gov.sg eldercare services](https://data.gov.sg/dataset/eldercare-services)
- AIC has had a Mobile E-care Locator app that searches community care services and gives directions. — [SMA News "AIC Says"](https://www.sma.org.sg/UploadedImg/files/Publications%20-%20SMA%20News/4508/AIC%20Says.pdf)
- HealthHub has caregiving resources on costs, grants, support groups and tips, plus a home care services A to Z page. — [GovTech TechNews](https://tech.gov.sg/media/technews/how-tech-can-relieve-caregiver-burnout); [HealthHub home care](https://www.healthhub.sg/a-z/medical-and-care-facilities/senior_home_care_services)
- LifeSG is GovTech's citizen app, and SupportGoWhere sits under the LifeSG brand. — [GovTech LifeSG](https://www.tech.gov.sg/products-and-services/for-citizens/digital-services/lifesg/)
- Hospital-cluster tools: NHG's CarePal in the NHG Health App (training videos, hotlines, wellness tips); TTSH "Find Care in Your Neighbourhood". — [GovTech TechNews](https://tech.gov.sg/media/technews/how-tech-can-relieve-caregiver-burnout); [TTSH](https://ttsh.com.sg/Community-Health/for-residents/Find-Care-in-Your-Neighbourhood/Pages/default.aspx)
- Applications are handled separately. For example, the Home Caregiving Grant is applied for through AIC's eFASS and needs a Functional Assessment Report from a GP. — [MissLobang, Nov 2026](https://www.misslobang.com/article/best-home-care-eldercare-services-singapore-2026)
- MSF keeps its own caregiver recognition and support page. — [MSF](https://www.msf.gov.sg/what-we-do/swd/key-areas-of-support/recognition-support-for-caregivers)

### Inferences
- A family typically has to visit 3 to 5 government properties: one to learn what exists (CSR), one to find a place (E-Care Locator or provider lists), one to apply (eFASS), one for health records (HealthHub), plus phone calls. None of them carries the family's case from start to finish.

### Gaps
- Whether Silver Pages is now merged into aic.sg, and the current state of the "AIC Care Service Map", is unconfirmed.
- No App Store or Play Store ratings were found for LifeSG, HealthHub or the NHG Health App in this pass.
- "CareGiver Connect" and the "Caregiver Support Network": no reliable source found.

## 3. Private and non-profit players

### Takeaway
Private platforms (Homage, Jaga-Me, Active Global, CaregiverAsia) sell their own services and do not help families compare across the system or check subsidies. Subsidised providers (NTUC Health, St Luke's) are cheap after subsidy but often do not publish prices. Independent comparison sites (MissLobang, nursinghomeguide.sg) partly fill the price-transparency gap, but by hand and without eligibility logic.

### Cited Findings
- **Homage**: on-demand home care marketplace. Elderly care from $23/hr (prepaid 200 hr block = $4,600). Pay-as-you-go $28/hr for weekday 1 to 2 hours. Surcharges for short or urgent bookings, cancellation fees within 7 days, cards only. — [Homage](https://www.homage.sg/services/elderly-care/); [MissLobang](https://www.misslobang.com/article/best-home-care-eldercare-services-singapore-2026)
- Homage's iOS listing shows 4.9/5 from 37 ratings (storefront not stated). An Australian-storefront tracker shows 4.67/69, with complaints about a slow app and a booking-date bug. Glassdoor shows 2.9/5 from 124 employee reviews (caregiver pay, transport, unsafe homes). — [App Store](https://apps.apple.com/app/id1277541542); [apptail](https://apptail.io/app/homage-care-where-you-are-iQm/australia); [Glassdoor](https://www.glassdoor.sg/Reviews/Homage-Caregiver-Reviews-EI_IE2361991.0,6_KO7,16.htm)
- Homage also publishes content guides on schemes and costs, which work as SEO lead generation. Its guide says nearly 50% of potential caregivers need financial help or training but don't know the schemes exist. — [Homage scheme guide](https://www.homage.sg/resources/financial-assistance-for-elderly-and-caregiver-grants-singapore/); [Homage care options 2026](https://www.homage.sg/resources/elderly-care-options-singapore/)
- **Jaga-Me** (Alliance Healthcare Group): GST-inclusive caregiving $37.06/hr on weekdays ($32.70 at 12+ hrs). Weekend nurse up to $55.59/hr. Transport $32.70 per visit. Google 4.4 from 83 reviews; "pricey" is a common criticism. — [MissLobang](https://www.misslobang.com/article/best-home-care-eldercare-services-singapore-2026); [nursinghomeguide.sg](https://nursinghomeguide.sg/home-care/jaga-me-mobile-medical-home-care/)
- **NTUC Health** (subsidised): from $4.80/hr after subsidy, with up to 95% subsidy, a $60 admin fee and a cap of 360 subsidised hours a year. — [MissLobang](https://www.misslobang.com/article/best-home-care-eldercare-services-singapore-2026)
- **Active Global Caregivers**: live-in caregivers at S$600 to 1,000/month salary plus S$2,725 to 3,597 placement fee. Its fees page still listed the HCG as S$200/month (outdated). — [MissLobang](https://www.misslobang.com/article/best-home-care-eldercare-services-singapore-2026)
- **St Luke's ElderCare, Orange Valley, ECON**: no fees published; entry is by referral or a care coordinator's quote. Only 5 of 8 providers reviewed publish any rate. — [MissLobang](https://www.misslobang.com/article/best-home-care-eldercare-services-singapore-2026)
- **Allium Healthcare** offers a "Cost Navigator" ($250 to $705/day before GST), a rare provider-level cost tool. — [MissLobang](https://www.misslobang.com/article/best-home-care-eldercare-services-singapore-2026)
- **CaregiverAsia**: on-demand care marketplace that added caregiver profiles and training in 2017. — [Coconuts](https://coconuts.co/singapore/news/singapore-startups-online-portal-lifesaver-full-time-caregivers)
- **MyCaregiver.sg**: an association portal that aggregates profiles from 200+ MOM-licensed agencies, used to hire a helper or caregiver. — [MyCaregiver.sg](https://mycaregiver.sg/)
- **Dementia Singapore**: the Dementia Friends app (with AIC, NCSS, Embreo) offers activities, dementia-friendly places and a QR "safe return" alert. DementiaHub.SG lists programmes and links to the CSR. — [MOH I Feel Young SG](https://www.moh.gov.sg/ifeelyoungsg/our-stories/how-can-we-build-stronger-ties/care-for-a-senior/app-ed-help-for-people-with-dementia-and-their-caregivers); [DementiaHub.SG](https://www.dementiahub.sg/dementia/programmes-and-services/)
- **Research and pilot apps**: Duke-NUS CareBuddy (information, coordination and support; trial ongoing); NTU 2021 community caregiver app usability study. — [Duke-NUS CareBuddy](https://www.duke-nus.edu.sg/lcpc/research/empowering-caregivers/carebuddy); [JMIR Nursing 2021](https://nursing.jmir.org/2021/2/e25679)
- **Comparison and review sites**: nursinghomeguide.sg (fees, reviews, photos per provider); MissLobang (re-checked prices, Nov 2026). — [nursinghomeguide.sg](https://nursinghomeguide.sg/home-care/homage-home-care-home-nursing-home-physiotherapy-part-time-caregiver-respite-care-elderly-care/); [MissLobang](https://www.misslobang.com/article/best-home-care-eldercare-services-singapore-2026)

### Inferences
- Families can't easily compare prices because quotes mix pre- and post-subsidy, GST-inclusive and exclusive, and hourly versus bundle pricing. A tool that normalises this ("your likely out-of-pocket per month") does not exist.
- The private apps are booking tools for their own supply, not neutral navigators.

### Gaps
- Caregivers Alliance (CAL), Lions Befrienders, and the Dementia Singapore CareLine: no digital-tool details were found in this pass. They are mainly phone, programme and community services.
- Singapore-storefront App Store or Play ratings for Jaga-Me, CaregiverAsia, NTUC Health and Dementia Friends were not retrieved.
- No Reddit threads were surfaced by search. Qualitative criticism of the system comes from AWARE (2019) and commercial blogs.

## 4. Government plans 2025 to 2027: will the gap close soon?

### Takeaway
Government plans focus on in-person care coordination and caregiver assessment: one standardised assessment (Apr 2026), a single community care plan via ICCPs (from Oct 2026), and Caregiver Support Touchpoints (from 2027). None of the announcements found mentions a new consumer digital navigator, cost estimator or single caregiver portal. A centralised caregiver registry was asked about in Parliament and not addressed. Risk that the government fully closes the self-serve digital gap in the near term is moderate to low. The bigger risk is that a future version of the CSR adds cost estimates.

### Cited Findings
- Age Well SG: "Since April 2026, seniors who require long-term care services have started receiving one standardised care assessment." "From October 2026, seniors will also progressively have a single holistic community care plan". An Integrated Community Care Provider (ICCP) coordinates care for each sub-region. — [Age Well SG Care Support](https://www.agewellsg.gov.sg/care-support/)
- Other Age Well SG measures: Enhanced Home Personal Care (HPC+) with 24/7 tech monitoring; Shared Stay-in Senior Caregiving; Caregivers Training Grant up to $400/yr; 4,400 subsidised training places a year. — [Age Well SG Care Support](https://www.agewellsg.gov.sg/care-support/)
- The 2023 Age Well SG announcement promised seniors and caregivers "a single point of contact" to coordinate care across providers. — [MOH 2023](https://www.moh.gov.sg/newsroom/age-well-sg-to-support-our-seniors-to-age-actively-and-independently-in-the-community/)
- Parliamentary reply, 8 Oct 2026 (PQ by Gerald Giam): "From 2027, we will introduce Caregiver Support Touchpoints (CSTs)". The first are at five aged care service centres and three Enabling Services Hubs, and they will "proactively identify caregivers' needs, explain the types of support available, and connect them to appropriate support". The reply did not address the requested national caregiver registry and mentions no digital tool. — [MOH reply](https://www.moh.gov.sg/newsroom/outreach-to-identify-isolated-informal-caregivers-of-senior-citizens/)
- Home Caregiving Grant raised to up to $600/month from April 2026; tiers of $600, $400 and $200 by per-capita household income. — [Age Well SG / MOH search results](https://www.agewellsg.gov.sg/); [MissLobang](https://www.misslobang.com/article/best-home-care-eldercare-services-singapore-2026)

### Inferences
- The policy direction is human navigation (ICCP coordinators, CSTs), which reaches families only after they enter the system. The "first 48 hours" self-serve research phase, before any referral, stays underserved.
- New schemes and rate changes (such as the HCG going to $600) are already causing stale information on provider sites, so a tool that keeps figures current has value.

### Gaps
- No evidence of Forward SG or a Caregiver Support Action Plan item for a single digital caregiver portal in 2025 to 2026. Absence in search results is not proof that none exists.
- Budget 2027 has not happened yet (expected Feb 2027) and could announce digital measures.

## 5. Overseas analogues for design inspiration

### Takeaway
Australia's My Aged Care is the clearest benchmark. It combines a provider finder, star ratings, side-by-side comparison, price comparison and a fee estimator in one government site, which is the bundle Singapore lacks.

### Cited Findings
- My Aged Care "Find a provider": search by location, provider or care type; star ratings and compliance information for homes; save and compare providers side by side; compare Support at Home prices and room costs to find a room within budget. — [My Aged Care find a provider](https://myagedcare.gov.au/find-a-provider); [updated info](https://www.myagedcare.gov.au/news-and-updates/updated-information-help-you-find-provider)
- My Aged Care Fee Estimator (estimates the cost of government-funded care) and Home Care Package cost checker (hours of service a package level buys). — [Fee estimator](https://www.myagedcare.gov.au/news-and-updates/spotlight-my-aged-cares-fee-estimator); [cost checker](https://myagedcare.gov.au/news-and-updates/new-home-care-package-costs-checker-now-live)

### Gaps
- UK (NHS and council care cost calculators, "paying for care" tools) and US Eldercare Locator: not verified in this pass. No citations, so the report should not describe them in detail without checking.

## Gap table (synthesis)

Legend: Y = does it; P = partial or generic; N = no; ? = unverified.

| Need of a Singapore family | AIC CSR / SupportGoWhere | Silver Pages / E-Care Locator | HealthHub / LifeSG | AIC hotline / AIC Links / CSTs (2027) | Homage / Jaga-Me / CaregiverAsia | Comparison sites (MissLobang, nursinghomeguide) | Australia My Aged Care (benchmark) |
|---|---|---|---|---|---|---|---|
| Which service type fits my parent's needs | Y | P | P | Y (human) | N (own services only) | P | Y |
| Scheme and subsidy eligibility check | P (potential only) | N | P | Y (human) | N | N | Y |
| Personalised out-of-pocket cost estimate (post-subsidy, GST) | N | N | N | P | N (list prices only) | P (manual, generic) | Y (fee estimator) |
| Nearby providers on a map | P (via links) | Y | ? | P | N | P | Y |
| Real availability or waitlist | N | N | N | P | Y (own slots only) | N | P |
| Side-by-side provider comparison and quality ratings | N | N | N | N | N | P (reviews) | Y (star ratings) |
| Ordered next steps (referral, FAR, eFASS, documents) | P (generic) | N | N | Y (human, office hours) | N | P (advice) | Y |
| Combined plan for several needs (e.g. day care + home help + HCG + respite) | N | N | N | P (ICCP care plan from Oct 2026, only after entering the system) | N | N | P |
| Available 24/7 and self-serve before any referral | Y | Y | Y | N | Y | Y | Y |
| Caregiver's own needs (respite, training, burnout) | P | N | P | Y (CSTs from 2027) | N | N | P |
| Neutral, not selling one provider | Y | Y | Y | Y | N | Mostly | Y |
| Kept current after scheme changes | ? | ? | ? | Y | N (e.g. outdated HCG figure) | P (dated checks) | Y |

Key white space: no Singapore tool combines a needs-based recommendation, personalised post-subsidy cost, nearby options and an ordered action checklist in one self-serve flow. That is the My Aged Care bundle, adapted to Singapore's means-tested schemes.

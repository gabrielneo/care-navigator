/* Generated from schema.json by `npm run gen:types`. Do not edit by hand. */

export type Serviceid = string;
export type Name = string;
export type Officialterm = string;
export type Description = string;
export type Setting = "home" | "centre" | "residential" | "ward";
export type Scheme = ("non_residential" | "residential") | null;
export type Unit = string | null;
export type Defaultunitsperweek = number | null;
export type Blockhours = number | null;
export type Wardonly = boolean;
export type Howtoapplyid = string;
export type Sourceid = string;
export type Servicetypes = ServiceType[];
export type Ruleid = string;
export type Serviceid1 = string;
export type Q = "where" | "discharged" | "adl" | "alone" | "memory" | "helper" | "limits" | "med";
export type In = string[] | null;
export type Any = ("bath" | "dress" | "eat" | "toilet" | "move" | "transfer")[] | null;
export type None = boolean | null;
export type Is = boolean | null;
export type When = Clause[];
export type Reasontext = string;
export type Priority = number;
export type Enabled = boolean;
export type Note = string | null;
export type Sourceid1 = string;
export type Needrules = NeedRule[];
export type Label = string;
export type Branchid = "in_hospital" | "changed_at_home" | "struggling" | "in_nursing_home";
export type Discharged = boolean | null;
export type Notsure = boolean;
export type Answers = BranchAnswer[];
export type Branchid1 = "in_hospital" | "changed_at_home" | "struggling" | "in_nursing_home";
export type Firstcontact = string;
export type Flags = string[];
export type Asklist = string[];
export type Asklistconditions = {
  [k: string]: {
    [k: string]: number;
  };
} | null;
export type Timelinenotes = string[];
export type Links = Link[] | null;
export type Label1 = string;
export type Sourceid2 = string;
export type Sourceids = string[];
export type Branches = Branch[];
export type Note1 = string;
export type Sourceid3 = string;
export type Gstsourceid = string;
export type Serviceid2 = string;
export type Unit1 = string;
export type Pricelowsgd = number;
export type Lowsourceid = string;
export type Lowconfidence = "official" | "provider" | "aggregator";
export type Pricehighsgd = number;
export type Highsourceid = string;
export type Highconfidence = "official" | "provider" | "aggregator";
export type Derived = string | null;
export type Low = number;
export type High = number;
export type Sourceid4 = string;
export type Checkedon = string;
export type Prices = PriceReference[];
export type Effectivefrom = string;
export type Tierid = "T0" | "T1" | "T2" | "T3" | "T4" | "T5";
export type Pchimin = number;
export type Pchimax = number | null;
export type Avrule = string | null;
export type Tiers = Tier[];
export type Scheme1 = "non_residential" | "residential";
export type Sourceid5 = string;
export type Scle1969 = number;
export type Scgt1969 = number;
export type Pr = number;
export type Schemes = SubsidyScheme[];
export type Grantid = string;
export type Name1 = string;
export type Kind = "grant" | "payout" | "concession";
export type Period = "month" | "once_then_yearly";
export type Amountismaximum = boolean;
export type Amountmeaning = string | null;
export type Minadl = number;
export type Altminage = number | null;
export type Requireshelper = boolean;
export type Citizensonly = boolean;
export type Otherconditions = string;
export type Officialurl = string;
export type Officialsourceid = string | null;
export type Standardlevysourceid = string | null;
export type Effectivefrom1 = string;
export type Sourceid6 = string;
export type Grantrules = GrantRule[];
export type Alwaysbring = string[];
export type Applyid = string;
export type Firstcontact1 = string;
export type Steps = string[];
export type Extradocuments = string[];
export type Sourceid7 = string;
export type Routes = Route[];
export type Grantid1 = string;
export type Steps1 = string[] | null;
export type Extradocuments1 = string[] | null;
export type Sourceid8 = string;
export type Grantsteps = GrantStep[];
export type Contactid = string;
export type Kind1 = "aic_link" | "polyclinic";
export type Name2 = string;
export type Address = string;
export type Postalcode = string;
export type Lat = number;
export type Lng = number;
export type Hours = string | null;
export type Locationnote = string | null;
export type Locationprecision = "exact" | "sector";
export type Checkedon1 = string;
export type Sourceid9 = string;
export type Contacts = Contact[];
export type Name3 = string;
export type Phone = string;
export type Hours1 = string;
export type Languages = string[];
export type Checkedon2 = string;
export type Sourceid10 = string;
export type Placeid = string;
export type Kind2 = "fsc" | "cc";
export type Name4 = string;
export type Address1 = string;
export type Postalcode1 = string;
export type Lat1 = number;
export type Lng1 = number;
export type Featureupdatedon = string | null;
export type PlacesFile = Place[];
export type Lat2 = number;
export type Lng2 = number;
export type N = number;
export type Lat3 = number;
export type Lng3 = number;
export type Label2 = string;
export type Dataversion = string;
export type Builtat = string;
export type Curatedhash = string;
export type Sourceid11 = string;
export type Title = string;
export type Url = string;
export type Licence = string;
export type Checkedon3 = string;
export type Nextreview = string;
export type Sources = ManifestSource[];
export type Warnings = string[];

export interface DataFiles {
  rules: RulesBundle;
  contacts: ContactsBundle;
  places: PlacesFile;
  sectors: Sectors;
  manifest: Manifest;
}
/**
 * rules.json: everything the engine needs to match and cost.
 */
export interface RulesBundle {
  serviceTypes: Servicetypes;
  needRules: Needrules;
  branchRules: BranchRules;
  priceReferences: PriceReferences;
  subsidyTiers: SubsidyTiers;
  grantRules: Grantrules;
  howToApply: HowToApply;
}
export interface ServiceType {
  serviceId: Serviceid;
  name: Name;
  officialTerm: Officialterm;
  description: Description;
  setting: Setting;
  scheme: Scheme;
  unit: Unit;
  defaultUnitsPerWeek?: Defaultunitsperweek;
  blockHours?: Blockhours;
  wardOnly?: Wardonly;
  howToApplyId: Howtoapplyid;
  sourceId: Sourceid;
}
export interface NeedRule {
  ruleId: Ruleid;
  serviceId: Serviceid1;
  when: When;
  reasonText: Reasontext;
  priority: Priority;
  enabled?: Enabled;
  note?: Note;
  sourceId: Sourceid1;
}
export interface Clause {
  q: Q;
  in?: In;
  any?: Any;
  none?: None;
  is?: Is;
}
export interface BranchRules {
  answers: Answers;
  branches: Branches;
  dementiaFlag: DementiaFlag;
}
export interface BranchAnswer {
  label: Label;
  branchId: Branchid;
  discharged?: Discharged;
  notSure?: Notsure;
}
export interface Branch {
  branchId: Branchid1;
  firstContact: Firstcontact;
  flags: Flags;
  askList: Asklist;
  askListConditions?: Asklistconditions;
  timelineNotes: Timelinenotes;
  links?: Links;
  sourceIds: Sourceids;
}
export interface Link {
  label: Label1;
  sourceId: Sourceid2;
}
export interface DementiaFlag {
  when: Clause;
  note: Note1;
  sourceId: Sourceid3;
}
export interface PriceReferences {
  gstSourceId: Gstsourceid;
  prices: Prices;
}
export interface PriceReference {
  serviceId: Serviceid2;
  unit: Unit1;
  priceLowSgd: Pricelowsgd;
  lowSourceId: Lowsourceid;
  lowConfidence: Lowconfidence;
  priceHighSgd: Pricehighsgd;
  highSourceId: Highsourceid;
  highConfidence: Highconfidence;
  derived?: Derived;
  realBillAnchor?: RealBillAnchor | null;
  checkedOn: Checkedon;
}
export interface RealBillAnchor {
  low: Low;
  high: High;
  sourceId: Sourceid4;
}
export interface SubsidyTiers {
  effectiveFrom: Effectivefrom;
  tiers: Tiers;
  schemes: Schemes;
}
export interface Tier {
  tierId: Tierid;
  pchiMin: Pchimin;
  pchiMax?: Pchimax;
  avRule?: Avrule;
}
export interface SubsidyScheme {
  scheme: Scheme1;
  sourceId: Sourceid5;
  rates: Rates;
}
export interface Rates {
  [k: string]: Rates1;
}
export interface Rates1 {
  scLe1969: Scle1969;
  scGt1969: Scgt1969;
  pr: Pr;
}
export interface GrantRule {
  grantId: Grantid;
  name: Name1;
  kind: Kind;
  period: Period;
  amountByBand: Amountbyband;
  amountIsMaximum?: Amountismaximum;
  amountMeaning?: Amountmeaning;
  minAdl: Minadl;
  altMinAge?: Altminage;
  requiresHelper?: Requireshelper;
  citizensOnly?: Citizensonly;
  otherConditions: Otherconditions;
  officialUrl: Officialurl;
  officialSourceId?: Officialsourceid;
  standardLevySourceId?: Standardlevysourceid;
  effectiveFrom: Effectivefrom1;
  sourceId: Sourceid6;
}
export interface Amountbyband {
  [k: string]: number;
}
export interface HowToApply {
  alwaysBring: Alwaysbring;
  routes: Routes;
  grantSteps: Grantsteps;
}
export interface Route {
  applyId: Applyid;
  firstContact: Firstcontact1;
  steps: Steps;
  extraDocuments: Extradocuments;
  sourceId: Sourceid7;
}
export interface GrantStep {
  grantId: Grantid1;
  steps?: Steps1;
  extraDocuments?: Extradocuments1;
  sourceId: Sourceid8;
}
/**
 * contacts.json.
 */
export interface ContactsBundle {
  contacts: Contacts;
  hotline: Hotline;
}
export interface Contact {
  contactId: Contactid;
  kind: Kind1;
  name: Name2;
  address: Address;
  postalCode: Postalcode;
  lat: Lat;
  lng: Lng;
  hours?: Hours;
  locationNote?: Locationnote;
  locationPrecision?: Locationprecision;
  checkedOn: Checkedon1;
  sourceId: Sourceid9;
}
export interface Hotline {
  name: Name3;
  phone: Phone;
  hours: Hours1;
  languages: Languages;
  checkedOn: Checkedon2;
  sourceId: Sourceid10;
}
export interface Place {
  placeId: Placeid;
  kind: Kind2;
  name: Name4;
  address: Address1;
  postalCode: Postalcode1;
  lat: Lat1;
  lng: Lng1;
  featureUpdatedOn?: Featureupdatedon;
}
export interface Sectors {
  sectors: Sectors1;
  regions: Regions;
}
export interface Sectors1 {
  [k: string]: SectorCentre;
}
export interface SectorCentre {
  lat: Lat2;
  lng: Lng2;
  n: N;
}
export interface Regions {
  [k: string]: RegionCentre;
}
export interface RegionCentre {
  lat: Lat3;
  lng: Lng3;
  label: Label2;
}
export interface Manifest {
  dataVersion: Dataversion;
  builtAt: Builtat;
  curatedHash: Curatedhash;
  sources: Sources;
  files: Files;
  sizes: Sizes;
  warnings: Warnings;
}
export interface ManifestSource {
  sourceId: Sourceid11;
  title: Title;
  url: Url;
  licence: Licence;
  checkedOn: Checkedon3;
  nextReview: Nextreview;
}
export interface Files {
  [k: string]: string;
}
export interface Sizes {
  [k: string]: number;
}

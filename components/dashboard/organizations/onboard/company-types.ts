export type CompanyTypeProps = {
  title: string;
  value: string;
};

const companyTypes: CompanyTypeProps[] = [
  {
    title: "Individual / Sole Proprietor",
    value: "INDIVIDUAL",
  },
  {
    title: "Small Business (LLC, Partnership)",
    value: "SMALL_BUSINESS",
  },
  {
    title: "Corporation (C-Corp, S-Corp)",
    value: "CORPORATION",
  },
  {
    title: "Non-Profit Organization",
    value: "NON_PROFIT",
  },
];

export default companyTypes;

export type CompanyTypeProps = {
  title: string;
  value: string;
};

const companyTypes: CompanyTypeProps[] = [
  {
    title: "Sole Proprietor",
    value: "sole-proprietor",
  },
  {
    title: "Partnership",
    value: "partnership",
  },
  {
    title: "C Corporation",
    value: "c-corporation",
  },
  {
    title: "S Corporation",
    value: "s-corporation",
  },
  {
    title: "LLC (Limited Liability Company)",
    value: "llc",
  },
];

export default companyTypes;

// ================= TYPES =================
export type DepartmentOption = {
  label: string;
  value: string; // code
};

// ================= ALL DEPARTMENTS =================
export const departmentGroups: {
  label: string;
  options: DepartmentOption[];
}[] = [
  {
    label: "UG Courses",
    options: [
      { label: "B.E. Aeronautical Engineering", value: "AERO" },
      { label: "B.E. Bio Medical Engineering", value: "BME" },
      { label: "B.E. Civil Engineering", value: "CIVIL" },
      { label: "B.Arch. Architecture", value: "ARCH" },

      { label: "B.E. Computer Science and Engineering", value: "CSE" },
      { label: "B.E. CSE (Cyber Security)", value: "CSE-CS" },
      { label: "B.E. CSE (AI & ML)", value: "CSE-AIML" },

      { label: "B.E. Electronics and Communication Engineering", value: "ECE" },
      { label: "B.E. Electrical and Electronics Engineering", value: "EEE" },
      { label: "B.E. Mechanical Engineering", value: "MECH" },

      { label: "B.Tech. Bio Technology", value: "BT" },
      { label: "B.Tech. Chemical Engineering", value: "CHEM" },
      { label: "B.Tech. Information Technology", value: "IT" },
      { label: "B.Tech. AI and Data Science", value: "AI-DS" },
      { label: "B.Tech. CSBS", value: "CSBS" },
    ],
  },

  {
    label: "PG Courses",
    options: [
      { label: "M.E. Communication Systems", value: "ME-COMM" },
      { label: "M.E. Computer Science Engineering", value: "ME-CSE" },
      { label: "M.E. Engineering Design", value: "ME-DESIGN" },
      { label: "M.E. Power Systems", value: "ME-POWER" },
      { label: "M.E. Structural Engineering", value: "ME-STRUCT" },

      { label: "MBA", value: "MBA" },
      { label: "MBA Logistics & SCM", value: "MBA-LOG" },
      { label: "MCA", value: "MCA" },
    ],
  },

  {
    label: "Research",
    options: [
      { label: "Ph.D CSE", value: "PHD-CSE" },
      { label: "Ph.D ECE", value: "PHD-ECE" },
      { label: "Ph.D Mechanical", value: "PHD-MECH" },
      { label: "Ph.D Chemistry", value: "PHD-CHEM" },
    ],
  },
];

// ================= FLAT LIST =================
export const allDepartments: DepartmentOption[] =
  departmentGroups.flatMap((g) => g.options);

// ================= HELPERS =================

// label from code
export const getDeptLabel = (code: string) => {
  return allDepartments.find((d) => d.value === code)?.label || code;
};

// code from label (for old data)
export const getDeptCode = (label: string) => {
  return allDepartments.find((d) => d.label === label)?.value || label;
};
import Navbar from "./Navbar";

const MainLayout = ({ children }: any) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

export default MainLayout;
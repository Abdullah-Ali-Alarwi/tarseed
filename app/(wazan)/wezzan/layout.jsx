import WezzanSidebar from "../../../components/wezzan/wezzanSidebar";
import WezzanHeader from "../../../components/wezzan/wezzanHeader";

export default function WazanLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 mt-10">

      <WezzanHeader />
      <WezzanSidebar />

      <main className="lg:mr-64 min-h-screen">
        {children}
      </main>

    </div>
  );
}
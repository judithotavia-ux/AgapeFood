import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function AdminLayout({ titulo, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar titulo={titulo} />
        <main style={{ padding: 28, flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

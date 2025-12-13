import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;

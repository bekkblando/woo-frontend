import { IconUser } from "@tabler/icons-react";
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <div className="w-full flex flex-col justify-center" >
        <div className="w-full flex justify-between items-center px-2">
          <div className="text-[15px] font-bold cursor-pointer" onClick={() => navigate('/')} >
              VraagMijnOverheid
          </div>
          <img src="/government-logo.png" alt="Woo Logo" className="h-12" />
          <div className="w-[90px] h-1"></div>
        </div>
      <div className="bg-[#EFF7FC] w-full h-4"></div>
      </div>

    );
};

export default Navbar;
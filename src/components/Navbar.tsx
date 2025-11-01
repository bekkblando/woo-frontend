import { IconUser } from "@tabler/icons-react";
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <div className="w-full flex flex-col justify-center cursor-pointer" onClick={() => navigate('/')} >
        <div className="w-full flex justify-between items-center px-2">
      <div className="text-[15px] font-bold">
          VraagMijnOverheid
      </div>
      <img src="/public/government-logo.png" alt="Woo Logo" className="h-12" />
      <div className="text-sm text-[#154475]">
          <IconUser className="inline-block"/>
          <span className="inline-block ml-2 justify-center items-center pt-1">Inloggen</span>
      </div>
      </div>
      <div className="bg-[#EFF7FC] w-full h-4"></div>
      </div>

    );
};

export default Navbar;
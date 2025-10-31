import { useContext } from 'react';
import { RequestFormContext } from '../context/RequestFormContext';

const RequestForm = () => {
    const requestForm = useContext(RequestFormContext);
    if (!requestForm) return null;
    return (
        <div className="h-full p-6 md:p-8 bg-white">
            <h1 className="text-2xl font-semibold text-[#154273]">Request Form</h1>
            <div className="mt-4">
                <label className="block text-sm font-medium text-[#154273]">Name</label>
                <input
                    type="text"
                    placeholder="Enter your name"
                    value={requestForm.name}
                    onChange={(e) => requestForm.setName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-[#154273]/30 rounded outline-none focus:ring-2 focus:ring-[#154273] text-[#154273] placeholder:text-[#154273]/60"
                />
            </div>
            <div className="mt-6">
                <button className="bg-[#154273] text-white px-4 py-2 rounded">Submit</button>
            </div>
        </div>
    );
};

export default RequestForm;
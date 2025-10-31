import { createContext, useMemo, useState } from "react";

type RequestFormContextValue = {
  name: string;
  setName: (value: string) => void;
};

export const RequestFormContext = createContext<RequestFormContextValue | null>(null);

type Props = {
  children: React.ReactNode;
};

export function RequestFormProvider({ children }: Props) {
  const [name, setName] = useState<string>("");

  const value = useMemo<RequestFormContextValue>(
    () => ({
      name,
      setName,
    }),
    [name]
  );

  return <RequestFormContext.Provider value={value}>{children}</RequestFormContext.Provider>;
}



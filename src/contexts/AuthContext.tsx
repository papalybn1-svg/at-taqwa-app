import React from 'react';

export const AuthContext = React.createContext<{
  user: any;
  setUser: (u: any) => void;
}>({
  user: null,
  setUser: () => {},
});



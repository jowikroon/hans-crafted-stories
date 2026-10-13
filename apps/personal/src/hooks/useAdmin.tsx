import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
export const useAdmin = () => {
  const { user } = useAuth();
  const [result,setResult] = useState({ id: '', isAdmin: false, loading: true });
  useEffect(() => {
    let live = true;
    if (!user) { setResult({id:'',isAdmin:false,loading:false}); return; }
    setResult({id:user.id,isAdmin:false,loading:true});
    supabase.rpc('is_portal_owner' as never).then(({data,error}) => {
      if (live) setResult({id:user.id,isAdmin:!error && data===true,loading:false});
    });
    return () => { live=false; };
  },[user?.id]);
  return {isAdmin:result.id===(user?.id||'') && result.isAdmin,loading:!!user && (result.id!==user.id || result.loading)};
};

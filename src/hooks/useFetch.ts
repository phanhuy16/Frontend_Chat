import { useEffect, useState } from "react";
import axiosInstance from "../api/axios";

interface UserFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useFetch = <T,>(url: string, dependencies: any[] = []) => {
  const [state, setState] = useState<UserFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const response = await axiosInstance.get<T>(url);
        if (isMounted) {
          setState({
            data: response.data,
            loading: false,
            error: null
          });
        }
      } catch (error: any) {
        if (isMounted) {
          setState({
            data: null,
            loading: false,
            error: error.response?.data?.message || 'Error fetching data',
          });
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    }
  }, [dependencies]);

  return state;
}
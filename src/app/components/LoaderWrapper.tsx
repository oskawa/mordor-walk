"use client";
import { useLoading } from "../../context/LoadingContext";
import Loader from "./Loader";


export default function LoaderWrapper() {
  const { loading } = useLoading();
  return loading ? <Loader /> : null;
}

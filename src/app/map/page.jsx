"use client";
import { useState } from "react";
import Scene from "../components/Map";
import Walked from "../components/Walked";
export default function Map() {
  const [activeMenu, setActiveMenu] = useState("walked");

  return (
    <>
      
      {activeMenu === "scene" && <Scene setActiveMenu={setActiveMenu}/>}
      {activeMenu === "walked" && <Walked setActiveMenu={setActiveMenu}/>}
      
    </>
  );
}

import React from "react";
import { ThreeCircles } from "react-loader-spinner";

const Loader = () => {

  const loader_cmp ={
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: 'blur(7px)',
    background: "rgba(41, 40, 40, 0.65)",
    zIndex: "9999999999",
    overflow: "hidden",
    position: "fixed",
    inset: 0,

  };

  return (
    <div style={loader_cmp} className="loader-cmp flex items-center absolute h-full w-full">
      {/* <div className="lds-dual-ring"></div> */}
      <ThreeCircles
        height="80"
        width="80"
        color="#a465fc"
        wrapperStyle={{}}
        wrapperClass=""
        visible={true}
        ariaLabel="three-circles-rotating"
        outerCircleColor=""
        innerCircleColor=""
        middleCircleColor=""
      />
    </div>
  );
};

export default Loader;

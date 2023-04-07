import React from "react";
import { selectN, useAppSelector } from "./testCoreRedux";

export function TestComponent() {
  const n = useAppSelector(selectN);
  return <div>This is my test component. {""+n}</div>;
}
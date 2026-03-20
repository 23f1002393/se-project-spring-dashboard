import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError() as { statusText?: string; message?: string };
  console.error(error);

  return (
    <>
      <h1>Error Occurred!</h1>
      <p>{error.statusText}</p>
      <p>{error.message}</p>
    </>
  );
}

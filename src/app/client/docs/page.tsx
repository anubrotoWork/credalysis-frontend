'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import openApiSpec from '@/lib/openapi.json'; // Adjust path if you placed it elsewhere
import EndpointCard from '@/components/EndpointCard'; // Adjust path
import { OpenAPIV3_1 } from 'openapi-types'; // For better typing

const spec = openApiSpec as unknown as OpenAPIV3_1.Document;

function isParameterObject(
  param: OpenAPIV3_1.ParameterObject | OpenAPIV3_1.ReferenceObject
): param is OpenAPIV3_1.ParameterObject {
  return !('$ref' in param);
}

export default function HomePage() {
  const router = useRouter();
  const paths = spec.paths || {};
  const schemas = spec.components?.schemas || {};
  
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("auth") === "true";
    const isClient = localStorage.getItem("access") == "client";

    console.log(localStorage);
    if (!isLoggedIn) {
      router.push("/login");
    }

    if(!isClient) {
      alert("you are not client financial institution");
      router.push("/login");
    }

  }, [router]);

  // const handleLogout = () => {
  //   localStorage.removeItem("auth");
  //   localStorage.removeItem("email");
  //   localStorage.removeItem("access");
  //   router.push("/login");
  // };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-slate-100 min-h-screen">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-800">{spec.info.title}</h1>
        <p className="text-lg text-gray-600">Version: {spec.info.version}</p>
      </header>

      <main>
        {Object.entries(paths).map(([path, pathItem]) => (
          pathItem && Object.entries(pathItem).map(([method, operation]) => {
            // Filter out non-operation properties like 'parameters' that might be at the path level
            if (typeof operation !== 'object' || !('responses' in operation)) {
              return null;
            }
            // Type assertion for operation
            const op = { ...operation } as OpenAPIV3_1.OperationObject;

            if (op.parameters) {
              op.parameters = op.parameters
                .filter(isParameterObject)
                .filter(param =>
                  ['header', 'path', 'query', 'cookie'].includes(param.in)
                );
            }


            return (
              <EndpointCard
                key={`${path}-${method}`}
                path={path}
                method={method}
                operation={op} // Now matches your stricter type!
                allSchemas={schemas as Record<string, OpenAPIV3_1.SchemaObject>} 
              />
            );
          })
        ))}
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>API Documentation generated from OpenAPI spec.</p>
      </footer>
    </div>
  );
}
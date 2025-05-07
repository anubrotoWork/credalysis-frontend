// components/EndpointCard.tsx

import React from 'react';
import OpenApiSchemaViewer from '@/components/OpenApiSchemaViewer';
import type { OpenAPIV3_1 } from 'openapi-types';

// Type guards for OpenAPI unions
function isReferenceObject(obj: unknown): obj is OpenAPIV3_1.ReferenceObject {
  return typeof obj === 'object' && obj !== null && '$ref' in obj;
}
// function isParameterObject(param: OpenAPIV3_1.ParameterObject | OpenAPIV3_1.ReferenceObject): param is OpenAPIV3_1.ParameterObject {
//   return !isReferenceObject(param);
// }
function isRequestBodyObject(body: OpenAPIV3_1.RequestBodyObject | OpenAPIV3_1.ReferenceObject): body is OpenAPIV3_1.RequestBodyObject {
  return !isReferenceObject(body);
}
function isResponseObject(resp: OpenAPIV3_1.ResponseObject | OpenAPIV3_1.ReferenceObject): resp is OpenAPIV3_1.ResponseObject {
  return !isReferenceObject(resp);
}

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET': return 'bg-green-600 hover:bg-green-700';
    case 'POST': return 'bg-blue-600 hover:bg-blue-700';
    case 'PUT': return 'bg-yellow-500 hover:bg-yellow-600 text-black';
    case 'DELETE': return 'bg-red-600 hover:bg-red-700';
    case 'PATCH': return 'bg-purple-600 hover:bg-purple-700';
    default: return 'bg-gray-600 hover:bg-gray-700';
  }
};

interface EndpointCardProps {
  path: string;
  method: string;
  operation: OpenAPIV3_1.OperationObject;
  allSchemas: Record<string, OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject>;
}

const EndpointCard: React.FC<EndpointCardProps> = ({
  path,
  method,
  operation,
  allSchemas,
}) => {
  return (
    <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center mb-4">
        <span className={`text-sm font-semibold px-3 py-1 rounded-md text-white mr-3 ${getMethodColor(method)}`}>
          {method.toUpperCase()}
        </span>
        <h2 className="text-xl font-mono font-semibold text-gray-700">{path}</h2>
      </div>

      {operation.summary && <p className="text-gray-600 mb-1">{operation.summary}</p>}
      {operation.operationId && (
        <p className="text-xs text-gray-500 mb-4">
          Operation ID: <code className="bg-gray-200 p-1 rounded">{operation.operationId}</code>
        </p>
      )}

      {/* Parameters */}
      {operation.parameters && operation.parameters.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-semibold text-gray-700 mb-2">Parameters</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left border-b border-gray-300">Name</th>
                  <th className="px-4 py-2 text-left border-b border-gray-300">In</th>
                  <th className="px-4 py-2 text-left border-b border-gray-300">Required</th>
                  <th className="px-4 py-2 text-left border-b border-gray-300">Type</th>
                  <th className="px-4 py-2 text-left border-b border-gray-300">Description</th>
                </tr>
              </thead>
              <tbody>
                {operation.parameters.map((param, index) => {
                  if (isReferenceObject(param)) {
                    // You may want to resolve and display $ref parameters here
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td colSpan={5} className="px-4 py-2 border-b border-gray-300 font-mono text-red-400">
                          $ref: {param.$ref}
                        </td>
                      </tr>
                    );
                  }
                  // param is ParameterObject
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b border-gray-300 font-mono">{param.name}</td>
                      <td className="px-4 py-2 border-b border-gray-300">{param.in}</td>
                      <td className="px-4 py-2 border-b border-gray-300">{param.required ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2 border-b border-gray-300">
                        {'schema' in param && param.schema && 'type' in param.schema
                          ? (param.schema as OpenAPIV3_1.SchemaObject).type
                          : param.schema && isReferenceObject(param.schema)
                          ? '$ref'
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-2 border-b border-gray-300">
                        {param.schema && 'title' in param.schema
                          ? (param.schema as OpenAPIV3_1.SchemaObject).title || param.description || '-'
                          : param.description || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Body */}
      {operation.requestBody && isRequestBodyObject(operation.requestBody) && (
        <div className="mb-4">
          <h3 className="text-md font-semibold text-gray-700 mb-2">
            Request Body {operation.requestBody.required && <span className="text-red-500 text-xs">(required)</span>}
          </h3>
          {operation.requestBody.content &&
            operation.requestBody.content['application/json']?.schema && (
              <OpenApiSchemaViewer
                schema={operation.requestBody.content['application/json'].schema}
                allSchemas={allSchemas}
              />
            )}
        </div>
      )}

      {/* Responses */}
      <div className="mb-2">
        <h3 className="text-md font-semibold text-gray-700 mb-2">Responses</h3>
        {operation.responses &&
          Object.entries(operation.responses).map(([statusCode, response]) => {
            if (!isResponseObject(response)) {
              // ReferenceObject, could display $ref or resolve it if you want
              return (
                <div key={statusCode} className="mb-3 p-3 border border-gray-300 rounded bg-white">
                  <p className="font-semibold text-red-600">Response $ref: {response.$ref}</p>
                </div>
              );
            }
            // response is ResponseObject
            return (
              <div key={statusCode} className="mb-3 p-3 border border-gray-300 rounded bg-white">
                <p className="font-semibold">
                  <span className={`px-2 py-0.5 rounded text-xs mr-2 ${
                    parseInt(statusCode, 10) >= 200 && parseInt(statusCode, 10) < 300
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {statusCode}
                  </span>
                  {response.description}
                </p>
                {response.content?.['application/json']?.schema &&
                  Object.keys(response.content['application/json'].schema).length > 0 && (
                    <div className="mt-2">
                      <OpenApiSchemaViewer
                        schema={response.content['application/json']?.schema}
                        allSchemas={allSchemas}
                      />
                    </div>
                  )}
                {response.content?.['application/json']?.schema &&
                  Object.keys(response.content['application/json'].schema).length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Schema: (empty object / no specific structure defined)
                    </p>
                  )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default EndpointCard;
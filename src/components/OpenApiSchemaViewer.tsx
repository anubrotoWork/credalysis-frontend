// components/OpenApiSchemaViewer.tsx
import React from 'react';
import type { OpenAPIV3_1 } from 'openapi-types';

type Schema = OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;

interface OpenApiSchemaViewerProps {
  schema?: Schema;
  allSchemas: Record<string, Schema>;
  schemaName?: string;
}

function isReferenceObject(schema: Schema): schema is OpenAPIV3_1.ReferenceObject {
  return '$ref' in schema;
}

const resolveRef = (ref: string, allSchemas: Record<string, Schema>): Schema | undefined => {
  if (!ref.startsWith('#/components/schemas/')) {
    console.warn(`Unsupported $ref format: ${ref}`);
    return undefined;
  }
  const schemaName = ref.substring('#/components/schemas/'.length);
  return allSchemas[schemaName];
};

const OpenApiSchemaViewer: React.FC<OpenApiSchemaViewerProps> = ({ schema, allSchemas, schemaName }) => {
  if (!schema) {
    return <p className="text-sm text-gray-500">No schema defined.</p>;
  }

  // If schema is a reference, resolve it
  if (isReferenceObject(schema)) {
    const resolvedSchema = resolveRef(schema.$ref, allSchemas);
    if (resolvedSchema) {
      return <OpenApiSchemaViewer schema={resolvedSchema} allSchemas={allSchemas} schemaName={schemaName} />;
    }
    return <p className="text-sm text-red-500">Could not resolve $ref: {schema.$ref}</p>;
  }

  const currentSchemaName = schemaName || schema.title;

  const renderSchemaContent = (currentSchema: OpenAPIV3_1.SchemaObject, indentLevel = 0): React.JSX.Element => {
    if (currentSchema.type === 'object' && currentSchema.properties) {
      return (
        <>
          <span>{'{'}</span>
          {Object.entries(currentSchema.properties).map(([propName, propSchema]) => (
            <div key={propName} style={{ marginLeft: `${(indentLevel + 1) * 1}rem` }}>
              <span className="text-purple-400">{`"${propName}"`}</span>
              <span className="text-gray-400">: </span>
              {/* Recursively render property, resolving $refs if needed */}
              {isReferenceObject(propSchema)
                ? (() => {
                    const resolved = resolveRef(propSchema.$ref, allSchemas);
                    return resolved
                      ? renderSchemaContent(resolved as OpenAPIV3_1.SchemaObject, indentLevel + 1)
                      : <span className="text-red-400">Unresolved $ref</span>;
                  })()
                : renderSchemaContent(propSchema as OpenAPIV3_1.SchemaObject, indentLevel + 1)
              }
              {currentSchema.required?.includes(propName) && <span className="text-red-400 ml-1 text-xs">(required)</span>}
              <span className="text-gray-400">,</span>
            </div>
          ))}
          <span style={{ marginLeft: `${indentLevel * 1}rem` }}>{'}'}</span>
        </>
      );
    } else if (currentSchema.type === 'array' && currentSchema.items) {
      return (
        <>
          <span>{'['}</span>
          <div style={{ marginLeft: `${(indentLevel + 1) * 1}rem` }}>
            {isReferenceObject(currentSchema.items)
              ? (() => {
                  const resolved = resolveRef(currentSchema.items.$ref, allSchemas);
                  return resolved
                    ? renderSchemaContent(resolved as OpenAPIV3_1.SchemaObject, indentLevel + 1)
                    : <span className="text-red-400">Unresolved $ref</span>;
                })()
              : renderSchemaContent(currentSchema.items as OpenAPIV3_1.SchemaObject, indentLevel + 1)
            }
          </div>
          <span style={{ marginLeft: `${indentLevel * 1}rem` }}>{']'}</span>
        </>
      );
    } else if (currentSchema.anyOf) {
      return (
        <>
          <span className="text-blue-400">anyOf:</span>
          <span>{' ['}</span>
          {currentSchema.anyOf.map((subSchema, index) => (
            <div key={index} style={{ marginLeft: `${(indentLevel + 1) * 1}rem` }}>
              {isReferenceObject(subSchema)
                ? (() => {
                    const resolved = resolveRef(subSchema.$ref, allSchemas);
                    return resolved
                      ? renderSchemaContent(resolved as OpenAPIV3_1.SchemaObject, indentLevel + 1)
                      : <span className="text-red-400">Unresolved $ref</span>;
                  })()
                : renderSchemaContent(subSchema as OpenAPIV3_1.SchemaObject, indentLevel + 1)
              }
              {index < (currentSchema.anyOf || []).length - 1 && <span className="text-gray-400">,</span>}
            </div>
          ))}
          <span style={{ marginLeft: `${indentLevel * 1}rem` }}>{']'}</span>
        </>
      );
    } else {
      return <span className="text-green-400">{currentSchema.type || 'any'}</span>;
    }
  };

  return (
    <div className="bg-gray-800 text-gray-200 p-4 rounded-md text-sm font-mono overflow-x-auto">
      {currentSchemaName && <h5 className="text-md font-semibold text-gray-100 mb-2">{currentSchemaName}</h5>}
      <pre className="whitespace-pre-wrap break-all">
        {renderSchemaContent(schema)}
      </pre>
    </div>
  );
};

export default OpenApiSchemaViewer;
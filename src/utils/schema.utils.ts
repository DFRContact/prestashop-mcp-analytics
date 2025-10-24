/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { zodToJsonSchema } from 'zod-to-json-schema';
import { ZodSchema } from 'zod';

/**
 * Recursively resolve all $ref references in a JSON Schema object.
 *
 * Note: This function uses `any` types extensively because it works with
 * dynamic JSON Schema structures that don't have fixed types.
 */
function resolveRefs(
  obj: any,
  definitions: Record<string, any>,
  visited = new Set<string>()
): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveRefs(item, definitions, visited));
  }

  // Handle $ref
  if (obj.$ref && typeof obj.$ref === 'string') {
    const refPath = obj.$ref.replace(/^#\//, '').split('/');
    let resolved: any = { definitions };

    // Navigate the reference path
    for (const part of refPath) {
      resolved = resolved[part];
      if (!resolved) break;
    }

    if (resolved && typeof resolved === 'object') {
      // Create a unique key for cycle detection
      const refKey = obj.$ref;
      if (visited.has(refKey)) {
        // Circular reference detected, return the reference as-is
        return obj;
      }

      visited.add(refKey);

      // Merge the resolved object with any additional properties
      const { $ref, ...rest } = obj;
      const merged = { ...resolved, ...rest };

      // Recursively resolve the dereferenced object
      return resolveRefs(merged, definitions, visited);
    }
  }

  // Recursively process all properties
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveRefs(value, definitions, visited);
  }

  return result;
}

/**
 * Convert Zod schema to flat JSON Schema format expected by MCP SDK.
 *
 * The MCP SDK expects inputSchema in this format:
 * {
 *   type: "object",
 *   properties: {...},
 *   required: [...]
 * }
 *
 * But zodToJsonSchema produces:
 * {
 *   $ref: "#/definitions/SchemaName",
 *   definitions: { SchemaName: {...} },
 *   $schema: "http://json-schema.org/draft-07/schema#"
 * }
 *
 * This function dereferences the schema to produce the flat structure
 * and resolves all internal $ref references.
 */
export function zodToMcpJsonSchema(schema: ZodSchema, name: string): object {
  const jsonSchema = zodToJsonSchema(schema, name) as {
    $ref?: string;
    definitions?: Record<string, any>;
    [key: string]: unknown;
  };

  const definitions = jsonSchema.definitions || {};
  let result: any;

  // If schema has $ref, dereference it
  if (jsonSchema.$ref) {
    const refName = jsonSchema.$ref.replace('#/definitions/', '');
    const definition = definitions[refName];

    if (definition && typeof definition === 'object') {
      result = definition;
    } else {
      result = jsonSchema;
    }
  } else {
    result = jsonSchema;
  }

  // Recursively resolve all $ref occurrences
  result = resolveRefs(result, definitions);

  // Remove $schema, $ref, and definitions from the root
  const { $schema, $ref, definitions: _, ...cleanResult } = result;

  return cleanResult;
}

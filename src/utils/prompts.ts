export const Prompts = {
  queryHelperPrompt: (schema_json: string, user_question: string, database_type: string) => {
    if (database_type === "mongodb") {
      console.log(database_type)
      return `
      You are an expert MongoDB query generator.

      Database Schema:
      ${schema_json}

      User Question:
      "${user_question}"

      Your Task:
      1. Generate a valid MongoDB query for the user question.
      2. Return ONLY JSON with this exact format:

      For simple find queries:
      {
        "success": true,
        "comment": "Describe what query was used and why",
        "collection": "collection_name",
        "query": { /* MongoDB find query object */ },
        "queryData": { "example_row": {...} }
      }

      For complex queries requiring aggregation:
      {
        "success": true,
        "comment": "Describe what aggregation was used and why",
        "collection": "collection_name", 
        "aggregation": [ /* MongoDB aggregation pipeline */ ],
        "queryData": { "example_row": {...} }
      }

      Rules:
      - Use ONLY collections and fields from the schema
      - Use sample values from schema to build realistic conditions
      - If question needs JOIN-like operations, use $lookup in aggregation
      - If question needs GROUP BY, use $group in aggregation
      - Make logical assumptions for ambiguous questions
      - Limit results to 10 documents max
            `;
          } else {
            console.log(database_type)
            return `
      You are an expert SQL query generator.

      Database Schema:
      ${schema_json}

      User Question:
      "${user_question}"

      Your Task:
      1. Generate a valid SQL query for ${database_type}.
      2. Return ONLY JSON with this exact format:

      {
        "success": true,
        "comment": "Describe what query was used and why",
        "sql": "SELECT ... FROM ... WHERE ... LIMIT 10",
        "queryData": { "example_row": {...} }
      }

      Rules:
      - Use ONLY tables and columns from the schema
      - Use sample values from schema to build realistic conditions
      - Always add LIMIT 10 to prevent large result sets
      - Use proper SQL syntax for ${database_type}
      - Make logical assumptions for ambiguous questions
      - Use JOINs when question involves multiple tables
            `;
          }
    }
};
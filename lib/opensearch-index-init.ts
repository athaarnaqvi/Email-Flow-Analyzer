import { client } from "./opensearch";

const USERS_INDEX = "users";

export interface UserDocument {
  username?: string;
  email: string;
  msisdn: string;
  password: string;
  role: "admin" | "viewer" | "whitelist";
  created_at: string;
}

/**
 * Initialize the "users" index if it doesn't exist
 */
export async function initializeUsersIndex(): Promise<void> {
  try {
    // Check if index exists
    const indexExists = await client.indices.exists({
      index: USERS_INDEX,
    });

    if (indexExists) {
      console.log(`Index "${USERS_INDEX}" already exists`);
      return;
    }

    // Create the index with mapping
    await client.indices.create({
      index: USERS_INDEX,
      body: {
        mappings: {
          properties: {
            email: {
              type: "keyword",
              ignore_above: 256,
            },
            msisdn: {
              type: "keyword",
              ignore_above: 256,
            },
            password: {
              type: "keyword",
              ignore_above: 256,
            },
            role: {
              type: "keyword",
              ignore_above: 256,
            },
            created_at: {
              type: "date",
            },
          },
        },
      },
    });

    console.log(`Index "${USERS_INDEX}" created successfully`);
  } catch (error) {
    // Index already exists or other error
    console.error(`Error initializing index "${USERS_INDEX}":`, error);
  }
}

/**
 * Get user by email or username (supports both old and new schema)
 * Prefers exact case matches over case-insensitive matches
 */
export async function getUserByEmail(emailOrUsername: string): Promise<any> {
  try {
    const searchValue = emailOrUsername.trim();
    const searchValueLower = searchValue.toLowerCase();
    
    const response = await client.search({
      index: USERS_INDEX,
      body: {
        query: {
          bool: {
            should: [
              // Exact matches (higher priority with boost)
              { term: { "email.keyword": { value: searchValue, boost: 2 } } },
              { term: { "username.keyword": { value: searchValue, boost: 2 } } },
              // Case-insensitive matches (lower priority)
              { term: { "email.keyword": { value: searchValueLower, boost: 1 } } },
              { term: { "username.keyword": { value: searchValueLower, boost: 1 } } },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    // Handle response format - OpenSearch client 2.x returns { body, statusCode, headers, meta }
    const searchResult = response.body || response;
    
    if (!searchResult || !searchResult.hits || !searchResult.hits.hits || searchResult.hits.hits.length === 0) {
      return null;
    }

    // Return the highest scored result (which will be the exact match if it exists)
    return searchResult.hits.hits[0]._source;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Create new user
 */
export async function createUser(userData: Omit<UserDocument, "created_at">): Promise<string> {
  try {
    const response = await client.index({
      index: USERS_INDEX,
      refresh: 'wait_for',
      body: {
        ...userData,
        email: userData.email.toLowerCase(),
        created_at: new Date().toISOString(),
      },
    });

    // Handle response format - OpenSearch client returns { body, statusCode, headers, meta }
    const indexResponse = response.body || response;
    return (indexResponse._id as string) || "";
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(
  email: string,
  role: "admin" | "viewer" | "whitelist"
): Promise<boolean> {
  try {
    // Find the document by identifier (email or msisdn)
    const found = await findUserByIdentifier(email);
    if (!found) return false;

    // Update the role
    await client.update({
      index: USERS_INDEX,
      id: found.id,
      body: { doc: { role } },
    });

    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
}

/**
 * Get all users (limited to a reasonable size)
 */
export async function getAllUsers(): Promise<Array<Record<string, any>>> {
  try {
    const response = await client.search({
      index: USERS_INDEX,
      body: {
        // return _source only
        query: { match_all: {} },
      },
      size: 1000,
    });

    const result = response.body || response;
    if (!result || !result.hits || !result.hits.hits) return [];

    return result.hits.hits.map((h: any) => ({ _id: h._id, ...h._source }));
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

/**
 * Find a user document by email OR msisdn. Returns {id, source} or null
 */
export async function findUserByIdentifier(identifier: string): Promise<{ id: string; source: any } | null> {
  try {
    const value = identifier.trim();
    const response = await client.search({
      index: USERS_INDEX,
      body: {
        query: {
          bool: {
            should: [
              { term: { "email.keyword": { value: value.toLowerCase() } } },
              { term: { "email": { value: value.toLowerCase() } } },
              { term: { "username.keyword": { value: value.toLowerCase() } } },
              { term: { "username": { value: value.toLowerCase() } } },
              { term: { "msisdn.keyword": { value } } },
              { term: { "msisdn": { value } } },
            ],
            minimum_should_match: 1,
          },
        },
      },
      size: 1,
    });

    const result = response.body || response;
    if (!result || !result.hits || !result.hits.hits || result.hits.hits.length === 0) return null;

    const hit = result.hits.hits[0];
    return { id: hit._id, source: hit._source };
  } catch (error) {
    console.error("Error finding user by identifier:", error);
    return null;
  }
}

/**
 * Update user role by document id
 */
export async function updateUserRoleById(id: string, role: "admin" | "viewer" | "whitelist") {
  try {
    await client.update({
      index: USERS_INDEX,
      id,
      refresh: 'wait_for',
      body: { doc: { role } },
    });
    return true;
  } catch (error) {
    console.error("Error updating role by id:", error);
    return false;
  }
}

/**
 * Delete user by email
 */
export async function deleteUserByEmail(email: string): Promise<boolean> {
  try {
    // Use findUserByIdentifier so we match email, msisdn, or username
    const found = await findUserByIdentifier(email);
    if (!found) return false;

    await client.delete({ index: USERS_INDEX, id: found.id, refresh: 'wait_for' });
    return true;
  } catch (error) {
    console.error("Error deleting user by email:", error);
    return false;
  }
}

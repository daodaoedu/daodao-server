  
  example:

  git commit -m "docs(swagger): fix POST /users/me response schema in API documentation

  ## Why is this necessary?
  - POST /users/me endpoint returns both user data and JWT token after 
  - creating a user from temporary user. The Swagger documentation was 
  - showing a generic response schema instead of the correct structure, 
  - making it unclear to frontend developers that a token is returned.

  ## How does it address?
  - Add response schema mapping for POST /users/me in generate-swagger.ts
  - Use createUserResponseSchema which defines { user, token } structure
  - Regenerate OpenAPI specs to reflect the correct response format
  - API documentation now clearly shows token is returned for JWT refresh"
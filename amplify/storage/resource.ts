import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'salesApp',
  access: (allow) => ({
    'pdfs/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'public/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'fonts/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'assets/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
  })
});
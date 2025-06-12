import { defineStorage } from '@aws-amplify/backend';
import { GeneratePDF } from '../functions/generate-pdf/resource';
import { webhookProcess } from '../functions/webhookProcess/resource';

export const storage = defineStorage({
  name: 'salesApp',
  access: (allow) => ({
    'pdfs/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.resource(GeneratePDF).to(['write']),
      allow.resource(webhookProcess).to(['read', 'delete'])
    ],
    'assets/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.resource(GeneratePDF).to(['read'])
    ],
  })
});
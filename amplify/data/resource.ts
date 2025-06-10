import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { GetAllProducts } from "../functions/get-all-products/resourse";
import { SaveProduct } from "../functions/save-product/resource";
import { GeneratePDF } from "../functions/generate-pdf/resource";
import { UploadPDF } from "../functions/upload-pdf/resource";
import { webhookProcess } from "../functions/webhookProcess/resource";
import { DeleteProduct } from "../functions/delete-product/resource";
import { createUser } from "../functions/user-management/create-user/resource";
import { deleteUser } from "../functions/user-management/delete-user/resource";
import { updateUser } from "../functions/user-management/update-user/resource";

const schema = a.schema({
  // ================================
  // models 
  // ================================
  User: a
    .model({
      userId: a.id().required(),
      groups: a.string().array().required(),
      email: a.string().required(),
      firstName: a.string(),
      lastName: a.string(),
    })
    .identifier(["userId"])
    .authorization((allow) => [
      allow.groups(['Admin']).to(['read', 'create', 'update', 'delete']),
      allow.ownerDefinedIn("userId").identityClaim("userId"),
      allow.publicApiKey(),
    ]),

  Product: a
    .model({
      product_id: a.string().required(),
      main_sku: a.string(),
      title: a.string(),
      description: a.string(),
      main_image_url: a.string(),
      main_pdf_link: a.customType({
        id: a.string(),
        url: a.string(),
      }),
      status: a.string(),
      product_features: a.hasMany('ProductFeature', 'product_id'),
      product_specs: a.hasMany('ProductSpec', 'product_id'),
      product_variants: a.hasMany('ProductVariant', 'product_id'),
    })
    .secondaryIndexes((index) => [
      index('main_sku')
    ])
    .identifier(['product_id'])
    .authorization((allow) => [allow.authenticated().to(['read', 'create', 'update', 'delete']), allow.publicApiKey()]),

  ProductVariant: a.model({
    variant_id: a.string().required(),
    title: a.string(),
    sku: a.string(),
    pdfLink: a.string(),
    product_id: a.string(),
    product: a.belongsTo('Product', 'product_id'),
  })
    .secondaryIndexes((index) => [
      index('product_id')
    ])
    .identifier(['variant_id'])
    .authorization((allow) => [allow.authenticated().to(['read', 'create', 'update', 'delete']), allow.publicApiKey()]),

  ProductFeature: a.model({
    title: a.string(),
    image: a.string(),
    product_id: a.string(),
    product: a.belongsTo('Product', 'product_id'),
  })
    .secondaryIndexes((index) => [
      index('product_id')
    ])
    .authorization((allow) => [allow.authenticated().to(['read', 'create', 'update', 'delete']), allow.publicApiKey()]),

  ProductSpec: a.model({
    key: a.string(),
    value: a.string(),
    product_id: a.string(),
    product: a.belongsTo('Product', 'product_id'),
  })
    .secondaryIndexes((index) => [
      index('product_id')
    ])
    .authorization((allow) => [allow.authenticated().to(['read', 'create', 'update', 'delete']), allow.publicApiKey()]),


  // ProductCatalog: a.model({
  //   id: a.string().required(),
  //   name: a.string(),
  //   products: a.hasMany('Product', 'product_id'),
  //   user_id: a.string(),
  //   user: a.belongsTo('User', 'user_id'),
  // }).authorization((allow) => [allow.authenticated().to(['read', 'create', 'update', 'delete']), allow.publicApiKey()]),

  // ================================
  // functions queries and mutations
  // ================================
  createNewUser: a
    .mutation()
    .arguments({
      email: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      groups: a.string().array().required(),
      tempPassword: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.groups(['Admin'])])
    .handler(a.handler.function(createUser)),

  updateAUser: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      newGroups: a.string().array().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.groups(['Admin'])])
    .handler(a.handler.function(updateUser)),

  deleteAUser: a
    .mutation()
    .arguments({
      userId: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.groups(['Admin'])])
    .handler(a.handler.function(deleteUser)),
  GetAllProducts: a
    .query()
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(GetAllProducts))
    .returns(a.json()),

  SaveProduct: a
    .mutation()
    .arguments({
      RawProduct: a.json().required()
    })
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(SaveProduct))
    .returns(a.json()),

  DeleteProductLambda: a
    .mutation()
    .arguments({
      productId: a.string().required()
    })
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(DeleteProduct))
    .returns(a.json()),

  GeneratePDF: a
    .mutation()
    .arguments({
      Product: a.json().required()
    })
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(GeneratePDF))
    .returns(a.json()),

  UploadPDF: a
    .mutation()
    .arguments({
      productId: a.string().required(),
      pdfUrl: a.string().required()
    })
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(UploadPDF))
    .returns(a.json()),

}).authorization((allow) => [
  allow.resource(webhookProcess).to(['mutate', 'query', 'listen']),
  allow.resource(DeleteProduct).to(['mutate', 'query', 'listen']),
  allow.resource(SaveProduct).to(['mutate', 'query', 'listen']),
  allow.resource(GeneratePDF).to(['mutate', 'query', 'listen']),
  allow.resource(UploadPDF).to(['mutate', 'query', 'listen']),
  allow.resource(GetAllProducts).to(['query', 'listen', 'mutate']),
  allow.resource(createUser).to(['mutate', 'query', 'listen']),
  allow.resource(deleteUser).to(['mutate', 'query', 'listen']),
  allow.resource(updateUser).to(['mutate', 'query', 'listen']),
])

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30
    },
  },
});
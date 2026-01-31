import RESTSerializer from '@ember-data/serializer/rest';

export default class DashboardSerializer extends RESTSerializer {
  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    return {
      data: payload.courses.map(c => ({
        id: String(c.id),
        type: primaryModelClass.modelName,
        attributes: {
          title: c.title,
          description: c.description,
          price: c.price
        }
      }))
    };
  }
}

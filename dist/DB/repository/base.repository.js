"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async createOne({ data, options, }) {
        const [doc] = (await this.create({ data: [data], options })) || [];
        return doc;
    }
    async findOne({ filter, projection, options, }) {
        const doc = this.model.findOne(filter, projection);
        if (options?.lean) {
            doc.lean(options.lean);
        }
        if (options?.populate) {
            doc.populate(options.populate);
        }
        return await doc.exec();
    }
    async findById({ _id, projection, options, }) {
        const doc = this.model.findById(_id, projection);
        if (options?.lean) {
            doc.lean(options.lean);
        }
        if (options?.populate) {
            doc.populate(options.populate);
        }
        return doc.exec();
    }
    async updateOne({ filter, update, options, }) {
        return await this.model.updateOne(filter, update, options);
    }
    async updateMany({ filter, update, options, }) {
        return await this.model.updateMany(filter, update, options);
    }
    async findOneAndUpdate({ filter, update, options, }) {
        return await this.model.findOneAndUpdate(filter, update);
    }
    async findByIdAndUpdate({ _id, update, options, }) {
        return await this.model.findByIdAndUpdate(_id, update);
    }
    async deleteOne({ filter, options, }) {
        return await this.model.deleteOne(filter, options);
    }
    async deleteMany({ filter, options, }) {
        return await this.model.deleteMany(filter, options);
    }
    async findOneAndDelete({ filter, }) {
        return await this.model.findOneAndDelete(filter);
    }
    async findByIdAndDelete({ _id, }) {
        return await this.model.findByIdAndDelete(_id);
    }
}
exports.DatabaseRepository = DatabaseRepository;

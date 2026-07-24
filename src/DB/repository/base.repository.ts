import {
  AnyKeys,
  CreateOptions,
  DeleteResult,
  FlattenMaps,
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
  UpdateResult,
  UpdateWithAggregationPipeline,
} from "mongoose";
import { IPaginate } from "../../common/interfaces";
import { UpdateOptions } from "mongodb";

export abstract class DatabaseRepository<TRawDoc> {
  constructor(protected readonly model: Model<TRawDoc>) {}

  //__CREATE__
  async create({
    data,
  }: {
    data: AnyKeys<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc>[]>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[]>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc> | AnyKeys<TRawDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[] | HydratedDocument<TRawDoc>> {
    return await this.model.create(data as any, options);
  }

  async createOne({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>> {
    const [doc] = (await this.create({ data: [data], options })) || [];
    return doc as HydratedDocument<TRawDoc>;
  }

  //__FIND__

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean?: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null>;

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean?: true }) | null | undefined;
  }): Promise<null | FlattenMaps<TRawDoc>>;

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<any> {
    const doc = this.model.findOne(filter, projection);

    if (options?.lean) {
      doc.lean(options.lean) as any;
    }
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]) as any;
    }
    return await doc.exec();
  }


async find({
    filter,
    projection,
    options
}: {
    filter?: QueryFilter<TRawDoc>,
    projection?: ProjectionType<TRawDoc> | null | undefined,
    options?: QueryOptions<TRawDoc> | null | undefined
}): Promise<HydratedDocument<TRawDoc>[]> {
    const doc = this.model.find(filter, projection)
    if (options?.populate) doc.populate(options.populate as PopulateOptions[])
    if (options?.skip) doc.skip(options.skip)
    if (options?.limit) doc.limit(options.limit)
    // if (options?.lean) doc.lean(options.lean)
    return await doc.exec()
}

async paginate({
    filter,
    projection,
    options = {},
    page = 0,
    size = 5
}: {
    filter?: QueryFilter<TRawDoc>,
    projection?: ProjectionType<TRawDoc> | null | undefined,
    options?: QueryOptions<TRawDoc>,
    page?: number | string | undefined,
    size?: number | string | undefined,
}): Promise<IPaginate<TRawDoc>> {

    let count: number = -1
    if (Number(page) > 0) {
        page = parseInt(page as string);
        size = parseInt(size as string);
        options.skip = (page - 1) * size;
        options.limit = size;
        count = await this.model.countDocuments({ filter })
    }

    const docs = await this.find({filter:filter||{},projection,options})

return {
    docs,
    currentPage: Number(page) > 0 ? page : undefined,
    size: Number(page) > 0 ? size : undefined,
    pages: Number(page) > 0 ? Math.ceil(count / parseInt(size as string)) : undefined,
}
}


  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null>;

  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: true }) | null | undefined;
  }): Promise<null | FlattenMaps<TRawDoc>>;

  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<any> {
    const doc = this.model.findById(_id, projection);

    if (options?.lean) {
      doc.lean(options.lean);
    }
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    return doc.exec();
  }

  //__update__

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: UpdateOptions | null;
  }): Promise<UpdateResult> {
    return await this.model.updateOne(filter, update, options);
  }
  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: UpdateOptions | null;
  }): Promise<UpdateResult> {
    return await this.model.updateMany(filter, update, options);
  }

  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc>;
    options?: QueryOptions<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    if (Array.isArray(update)) {
      update.push({$set:{__v:{$add:["$__v",1]}}})
      return this.model.findOneAndUpdate(filter,update,{...options,updatePipeline:true})
    }
    return await this.model.findOneAndUpdate(filter, update,{...options,$incr:{__v:1}});
  }

  async findByIdAndUpdate({
    _id,
    update,
    options,
  }: {
    _id?: Types.ObjectId;
    update?: UpdateQuery<TRawDoc>;
    options?: QueryOptions<TRawDoc> | null;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findByIdAndUpdate(_id, update);
  }

  //__delete__

  async deleteOne({
    filter,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    options?: UpdateOptions | null;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter, options);
  }
  async deleteMany({
    filter,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    options?: UpdateOptions | null;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter, options);
  }

  async findOneAndDelete({
    filter,
  }: {
    filter?: QueryFilter<TRawDoc> | null;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findOneAndDelete(filter);
  }

  async findByIdAndDelete({
    _id,
  }: {
    _id?: Types.ObjectId;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findByIdAndDelete(_id);
  }
}

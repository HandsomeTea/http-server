import ES from '@/tools/es';
import { QueryDslQueryContainer, SearchResponse } from '@elastic/elasticsearch/lib/api/types';

export default class EsBase<Doc> {
    private index: string;
    constructor(index: string) {
        this.index = index;
    }

    private getData(document?: SearchResponse<Doc>) {
        return {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            total: document?.hits.total.value || 0,
            data: document?.hits.hits.map(a => ({ _id: a._id, ...a._source })) || []
        };
    }

    async insertOne(document: Doc) {
        await ES.server.index({
            index: this.index,
            refresh: true,
            document
        });
    }

    // ?
    async insertMany(document: Array<Doc>) {

    }

    async find(option: { query?: QueryDslQueryContainer, skip?: number, limit?: number }) {
        return this.getData(await ES.server.search({
            index: this.index,
            query: option.query,
            size: option.limit || 10,
            from: option.skip || 0
        }));
    }

    async findById(id: string) {
        const result = await ES.server.get<Doc>({
            index: this.index,
            refresh: true,
            id
        });

        return {
            _id: result._id,
            ...result._source
        } as { _id: string } & Doc;
    }

    async removeMany(query: QueryDslQueryContainer) {
        return await ES.server.deleteByQuery({
            index: this.index,
            refresh: true,
            query
        });
    }
}

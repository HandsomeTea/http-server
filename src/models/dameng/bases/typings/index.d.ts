export interface SQLOption<M, P extends keyof M> {
    $ne?: M[P]
    $in?: Array<M[P]>
    $notIn?: Array<M[P]>
    $like?: string
    $regexp?: string | RegExp
    $between?: [M[P], M[P]]
    $gt?: M[P]
    $lt?: M[P]
    $gte?: M[P]
    $lte?: M[P]
}

export type WhereOption<M> = {
    [P in keyof M]?: M[P] | SQLOption<M, P>
}

export interface QueryOption<M> {
    where?: WhereOption<M> & { $or?: Array<WhereOption<M>> }
    order?: Array<{ [P in keyof M]?: 'asc' | 'desc' }>
    limit?: number
    offset?: number
}

// export type UpsertOption<M> = { [P in keyof M]?: M[P] }
export type UpdateOption<M> = { [P in keyof M]?: M[P] extends string ? string | { $pull: M[P], $split: ',' } : M[P] }

export interface DmModelOption {
    type: 'DATE' | 'NUMBER' | 'STRING'
    dbField?: string
}

export type DmModel<M, M extends {}> = { [name in keyof M]: DmModelOption }

import executor from '../../main/ts/executor'
import Graph from '../../main/ts/graph'
import {
  IMode,
  IInput,
  IOutput,
  ITraverserInput,
  ITraverserOutput,
  IHandler,
  IVertex,
} from '../../main/ts/interface'

describe('executor', () => {
  const input = {data: 'foo', meta: {sequence: []}, opts: {}}
  const graph = new Graph({
    edges: ['AB', 'BC'],
    vertexes: ['A', 'B', 'C'],
    incidentor: {
      type: 'EDGE_LIST',
      representation: {
        'AB': ['A', 'B'],
        'BC': ['B', 'C']
      },
    },
  })
  const handler = ({data}: IInput): IOutput => ({data: {count: (data.count + 1 || 0)}})
  const traverser = ({meta, graph}: ITraverserInput): ITraverserOutput | null => {
    if (meta.sequence.length === 0) {
      return {meta: {...meta, sequence: ['A']}}
    }

    const representation: Array<[IVertex, IVertex]> = Object.values(graph.incidentor.representation)
    const prev = meta.sequence[meta.sequence.length - 1]
    const next: IVertex | null = (representation.find(([head]) => head === prev) || [])[1] || null

    if (next === null) {
      return null
    }

    return {meta: {...meta, sequence: [...meta.sequence, next]}}
  }

  describe('SYNC', () => {
    it('transits data from `source` to `target` vertex', () => {
      const res = executor({graph, handler, traverser, ...input})

      expect(res).toEqual({
        opts: {},
        data: {
          count: 2,
        },
        meta: {
          sequence: [
            'A',
            'B',
            'C',
          ],
        },
      })
    })
  })

  describe('ASYNC', () => {
    it('transits data from `source` to `target` vertex', async() => {
      const mode: IMode = 'async'
      const input = {data: 'foo', meta: {sequence: [], mode}, opts: {}}
      const handler: IHandler = ({data, meta}: IInput) => new Promise((resolve) => {
        setTimeout(() => resolve({data: {path: (data.path || '') + meta.sequence.slice(-1)}}), 100)
      })
      const res = executor({graph, handler, traverser, ...input})

      await expect(res).resolves.toEqual({
        opts: {},
        data: {
          path: 'ABC',
        },
        meta: {
          mode: 'async',
          sequence: [
            'A',
            'B',
            'C',
          ],
        },
      })
    })
  })
})

import * as data_dev from '@data/ui/dev/test-data'
import * as data_stag from '@data/ui/stag/test-data'
import * as data_prod from '@data/ui/prod/test-data'

const env = (process.env.ENV || 'stag').toLowerCase()

// specs read dataInput.user.<group>.<field> — the group comes from the environment of the run
const dataInput = {
    user: env === 'prod' ? data_prod : env === 'dev' ? data_dev : data_stag,
}
export default dataInput

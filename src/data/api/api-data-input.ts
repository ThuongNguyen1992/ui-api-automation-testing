import * as api_dev from '@data/api/dev/api-data'
import * as api_stag from '@data/api/stag/api-data'
import * as api_prod from '@data/api/prod/api-data'

const env = (process.env.ENV || 'stag').toLowerCase()

// services and specs read apiDataInput.user.<group>.<field>
const apiDataInput = {
    user: env === 'prod' ? api_prod : env === 'dev' ? api_dev : api_stag,
}
export default apiDataInput

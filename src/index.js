import { GraphQLClient } from 'graphql-request'

export const GET_DOMAINS_OWNED_BY_ADDRESS_FROM_SUBGRAPH = `
  query getDomains($userAddress: String!, $expiryDate: Int!) {
    account(id: $userAddress) {
      registrations(
        orderBy:expiryDate, orderDirection:asc,
        where:{ expiryDate_lt: $expiryDate }
      ) {
        expiryDate
        domain {
          labelName
        }
      }
    }
  }
`

const endpoint = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens'
const client = new GraphQLClient(endpoint, {
  headers: {
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site'
  }
})

export async function checkRenewal(userAddress, referrerAddress, {expiryDate, debug}) {
  if(!expiryDate){
    let date = new Date();
    expiryDate = date.setDate(date.getDate() + 30);  
  }else{
    expiryDate = expiryDate.getTime();
  }
  const { account } = await client.request(GET_DOMAINS_OWNED_BY_ADDRESS_FROM_SUBGRAPH, {
    userAddress: userAddress.toLowerCase(),
    expiryDate: parseInt(expiryDate / 1000)
  })
  const count = account.registrations.length
  const firstExpiryDate = account.registrations[0] && account.registrations[0].expiryDate
  if(debug){
    console.log(account.registrations.map((r) => { return [r.domain.labelName, new Date(r.expiryDate * 1000)]}))
  }
  const res = {
    numExpiringDomains: count,
    firstExpiryDate: firstExpiryDate && new Date(firstExpiryDate * 1000),
    renewalUrl: `https://app.ens.domains/address/${userAddress}?referrer=${referrerAddress}`
  }
  return res
}

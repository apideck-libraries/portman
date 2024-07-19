// Pre-request script to check the existing monetary_amount of the lead and then double it
let monetaryAmount = pm.collectionVariables.get("Leads_monetary_amount")
if (monetaryAmount > 0) {
    monetaryAmount *= 2;
} else {
    monetaryAmount = 25000;
}
// Update the environment variable with the new amount prior to updating the lead
pm.collectionVariables.set("Leads_monetary_amount", monetaryAmount);
import fetch from 'node-fetch';

const RECHARGE_API_TOKEN = '1205a8f93fbe6e78af79993ed7877573a4c60a8038bb31d294f0f5e8';

export interface RechargeDiscount {
    code?: string;
    discount_type?: string;
    value?: number;
    duration?: string; // forever, usage_limit, single_use
    duration_usage_limit?: number; //  This parameter is used and is required, when duration is set to usage_limit.
    status?: string;
    starts_at?: string;
    ends_at?: string;
    applies_to_resource?: string;
    applies_to_id?: number;

}

/**
 * data (Discount): array of:
 * - 0: Name
 * - 1: Value
 * - 2: Value Type
 * - 3: Times Used In Total
 * - 4: Usage Limit Per Code
 * - 5: Status
 * - 6: Start
 * - 7: End
 */
// https://developer.rechargepayments.com/#create-discount
export const mapShipifyCsvDiscountToRechargeDiscount = (data: string[]): RechargeDiscount => {
    const usageLimit = data[4];
    const startsAt = data[6] ? data[6].split(' ')[0] : null;
    const endsAt = data[7] ? data[7].split(' ')[0] : null;
    return {
        code: data[0],
        value: Math.abs(Number(data[1])),
        discount_type: data[2],
        duration: usageLimit ? 'usage_limit' : 'forever',
        duration_usage_limit: usageLimit ? Number(usageLimit) : null,
        status: 'enabled',
        starts_at: startsAt,
        ends_at: endsAt
    }
}

export const addDiscounts = async (discounts: RechargeDiscount[]) => {
    let promises = [];
    let total = 0;
    const maxPromises = 20;
    for (const discount of discounts) {
        promises.push(postDiscount(discount));

        if(promises.length > maxPromises) {
            await Promise.all(promises);
            promises = [];
            total += maxPromises; 
            console.log(`Progress total: ${total}`);
        }
    }

    await Promise.all(promises);
}



export const deleteAllDiscounts = async () => {
    let isData = true;
    let page = 1;

    while(isData) {
        const {discounts} = await getAllDiscounts(page);
        if(!discounts.length) {
            isData = false;
            continue;
        }

        for (const d of discounts) {
            await disableDiscount(d.id);
            await deleteDiscount(d.id);
            
        }
        page += 1;
    }
};


const disableDiscount = async (id: number) => {
    try {
        const res = await fetch(`https://api.rechargeapps.com/discounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: 'fully_disabled'
            }),
            headers: { 
                'x-recharge-access-token': RECHARGE_API_TOKEN
             },
        });
        return res.json();
    } catch (err) {
        console.log('disableDiscount ERROR', err);
    }
} 

const deleteDiscount = async (id: number) => {
    try {
        const res = await fetch(`https://api.rechargeapps.com/discounts/${id}`, {
            method: 'DELETE',
            headers: { 
                'x-recharge-access-token': RECHARGE_API_TOKEN
             },
        });
        return res;
    } catch (err) {
        console.log('deleteDiscount ERROR', err);
    }
} 


const getAllDiscounts = async (page: number) => {
    try {
        const res = await fetch(`https://api.rechargeapps.com/discounts?page=${page}`, {
            method: 'GET',
            headers: { 
                'x-recharge-access-token': RECHARGE_API_TOKEN
             },
        });
        return res.json();
    } catch (err) {
        console.log('getAllDiscounts ERROR', err);
    }
}



const postDiscount = async (discount: RechargeDiscount) => {
    try {
        const res = await fetch('https://api.rechargeapps.com/discounts', {
            method: 'post',
            body: JSON.stringify(discount),
            headers: { 
                'Content-Type': 'application/json',
                'x-recharge-access-token': RECHARGE_API_TOKEN
             },
        });
        return res.json();
    } catch (err) {
        console.log('postDiscount ERROR', err);
    }
}


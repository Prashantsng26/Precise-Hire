import { docClient } from '../config/awsConfig.js';
import { PutCommand, ScanCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const JOBS_TABLE = process.env.DYNAMODB_TABLE_JOBS;
const CANDIDATES_TABLE = process.env.DYNAMODB_TABLE_CANDIDATES;

export async function saveJob(jobData) {
  const item = {
    ...jobData,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  await docClient.send(new PutCommand({
    TableName: JOBS_TABLE,
    Item: item
  }));
  return item;
}

export async function getJob(jobId) {
  console.log(`[DYNAMO] Fetching job: ${jobId}`);
  try {
    // Try Get first (more efficient if jobId is PK)
    const getRes = await docClient.send(new GetCommand({
      TableName: JOBS_TABLE,
      Key: { jobId }
    }));
    if (getRes.Item) return getRes.Item;

    // Fallback to Scan (if jobId is not the PK)
    const scanRes = await docClient.send(new ScanCommand({
      TableName: JOBS_TABLE,
      FilterExpression: 'jobId = :jobId',
      ExpressionAttributeValues: { ':jobId': jobId }
    }));
    return scanRes.Items?.[0] || null;
  } catch (e) {
    console.error(`[DYNAMO] getJob error for ${jobId}:`, e.message);
    return null;
  }
}

export async function updateJob(jobId, updates) {
  console.log(`[DYNAMO] Updating job: ${jobId}`, updates);
  try {
    // We need to find the correct primary key for update
    const job = await getJob(jobId);
    if (!job) throw new Error('Job not found');

    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrVal = `:val${index}`;
      updateExpression.push(`${attrName} = ${attrVal}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrVal] = updates[key];
    });

    await docClient.send(new UpdateCommand({
      TableName: JOBS_TABLE,
      Key: { jobId }, // Assuming jobId is PK. If not, this might need adjust
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));
  } catch (e) {
    console.error(`[DYNAMO] updateJob error for ${jobId}:`, e.message);
    throw e;
  }
}

export async function saveCandidates(candidates, jobId) {
  let savedCount = 0;
  for (const candidate of candidates) {
    const item = {
      ...candidate,
      jobId,
      currentRound: 'ATS Screening',
      status: 'pending',
      resumeText: candidate.resumeText ? candidate.resumeText.substring(0, 10000) : null
    };
    await docClient.send(new PutCommand({
      TableName: CANDIDATES_TABLE,
      Item: item
    }));
    savedCount++;
  }
  return savedCount;
}

export async function getCandidatesByJob(jobId) {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: CANDIDATES_TABLE,
      FilterExpression: 'jobId = :jobId',
      ExpressionAttributeValues: { ':jobId': jobId }
    }));
    return response.Items || [];
  } catch (e) {
    console.error(`[DYNAMO] getCandidatesByJob error:`, e.message);
    return [];
  }
}

export async function updateCandidate(candidateId, jobId, updates) {
  console.log(`[DYNAMO] Updating candidate: ${candidateId}`, updates);
  try {
    const updateExpression = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrVal = `:val${index}`;
      updateExpression.push(`${attrName} = ${attrVal}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrVal] = updates[key];
    });

    await docClient.send(new UpdateCommand({
      TableName: CANDIDATES_TABLE,
      Key: { candidateId, jobId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));
  } catch (e) {
    console.error(`[DYNAMO] updateCandidate error for ${candidateId}:`, e.message);
    throw e;
  }
}

export async function getDashboardStats() {
  try {
    const jobs = await docClient.send(new ScanCommand({ TableName: JOBS_TABLE }));
    const candidates = await docClient.send(new ScanCommand({ TableName: CANDIDATES_TABLE }));
    
    const totalCandidates = candidates.Items?.length || 0;
    const activeJobs = jobs.Items?.length || 0;
    
    const scores = candidates.Items
      ?.map(c => c.weighted_score)
      .filter(s => s !== undefined) || [];
    
    const avgScore = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : 0;

    return {
      totalCandidates,
      avgScore,
      activeJobs,
      totalJobs: activeJobs,
      recentJobs: (jobs.Items || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    };
  } catch (e) {
    console.error('[DYNAMO] Dashboard stats error:', e.message);
    return { totalCandidates: 0, avgScore: 0, activeJobs: 0, totalJobs: 0, recentJobs: [] };
  }
}

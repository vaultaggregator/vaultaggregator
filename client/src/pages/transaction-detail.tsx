import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Copy, CheckCircle, XCircle, Clock, ArrowRight, ArrowUpRight } from 'lucide-react';
import { AddressLink } from '@/components/entity-links';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import Footer from '@/components/footer';

interface TransactionDetails {
  hash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string | null;
  value: string;
  gasLimit: string;
  gasUsed?: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce: number;
  status?: number;
  timestamp: number;
  confirmations: number;
  data: string;
  logs: TransactionLog[];
  functionName?: string;
  methodId?: string;
}

interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
  removed: boolean;
}

export default function TransactionDetail() {
  const params = useParams<{ txHash: string; network?: string }>();
  const [, setLocation] = useLocation();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const { txHash, network = 'ethereum' } = params;
  
  const { data: transaction, isLoading, error } = useQuery<TransactionDetails>({
    queryKey: [`/api/transaction/${txHash}?network=${network}`],
    enabled: !!txHash,
    staleTime: 60000, // Cache for 1 minute
  });
  
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const formatEthValue = (value: string): string => {
    try {
      const valueInWei = BigInt(value);
      const valueInEth = Number(valueInWei) / 1e18;
      return valueInEth.toFixed(6);
    } catch {
      return '0';
    }
  };
  
  const formatGasPrice = (gasPrice: string): string => {
    try {
      const gasPriceInWei = BigInt(gasPrice);
      const gasPriceInGwei = Number(gasPriceInWei) / 1e9;
      return gasPriceInGwei.toFixed(2);
    } catch {
      return '0';
    }
  };
  
  const calculateTransactionFee = (gasUsed: string, gasPrice: string): string => {
    try {
      const gasUsedBig = BigInt(gasUsed);
      const gasPriceBig = BigInt(gasPrice);
      const feeInWei = gasUsedBig * gasPriceBig;
      const feeInEth = Number(feeInWei) / 1e18;
      return feeInEth.toFixed(6);
    } catch {
      return '0';
    }
  };
  
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };
  
  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="h-6 w-6 p-0 ml-2"
    >
      {copiedField === field ? (
        <CheckCircle className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (error || !transaction) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Transaction Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The transaction hash could not be found on the {network} network.
            </p>
            <Button onClick={() => setLocation('/')} variant="outline">
              Go Back Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const getStatusBadge = () => {
    if (transaction.status === 1) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Success
        </Badge>
      );
    } else if (transaction.status === 0) {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };
  
  return (
    <>
      <Header />
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Transaction Details</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Network:</span>
          <Badge variant="outline" className="capitalize">{network}</Badge>
          {getStatusBadge()}
        </div>
      </div>
      
      {/* Transaction Hash */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction Hash</span>
            <CopyButton text={transaction.hash} field="hash" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-sm break-all">{transaction.hash}</p>
        </CardContent>
      </Card>
      
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Basic transaction information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Block Number</label>
              <div className="flex items-center">
                <p className="font-mono">{transaction.blockNumber.toLocaleString()}</p>
                <CopyButton text={transaction.blockNumber.toString()} field="blockNumber" />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Transaction Index</label>
              <p className="font-mono">{transaction.transactionIndex}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
              <p>{formatTimestamp(transaction.timestamp)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Confirmations</label>
              <p className="font-mono">{transaction.confirmations.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* From/To */}
      <Card>
        <CardHeader>
          <CardTitle>Addresses</CardTitle>
          <CardDescription>From and to addresses involved in this transaction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">From</label>
              <div className="flex items-center">
                <AddressLink address={transaction.from} className="font-mono text-sm" />
                <CopyButton text={transaction.from} field="from" />
              </div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">To</label>
              <div className="flex items-center">
                {transaction.to ? (
                  <>
                    <AddressLink address={transaction.to} className="font-mono text-sm" />
                    <CopyButton text={transaction.to} field="to" />
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">Contract Creation</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Value & Function */}
      <Card>
        <CardHeader>
          <CardTitle>Value & Function</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Value</label>
              <p className="font-mono">{formatEthValue(transaction.value)} ETH</p>
            </div>
            
            {transaction.functionName && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Function</label>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{transaction.functionName}</Badge>
                  {transaction.methodId && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {transaction.methodId}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Gas Details */}
      <Card>
        <CardHeader>
          <CardTitle>Gas Details</CardTitle>
          <CardDescription>Gas usage and pricing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gas Limit</label>
              <p className="font-mono">{BigInt(transaction.gasLimit).toLocaleString()}</p>
            </div>
            
            {transaction.gasUsed && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gas Used</label>
                <div className="space-y-1">
                  <p className="font-mono">{BigInt(transaction.gasUsed).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {((Number(transaction.gasUsed) / Number(transaction.gasLimit)) * 100).toFixed(1)}% of limit
                  </p>
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gas Price</label>
              <p className="font-mono">{formatGasPrice(transaction.gasPrice)} Gwei</p>
            </div>
            
            {transaction.gasUsed && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Fee</label>
                <p className="font-mono">
                  {calculateTransactionFee(transaction.gasUsed, transaction.gasPrice)} ETH
                </p>
              </div>
            )}
            
            {transaction.maxFeePerGas && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Max Fee Per Gas</label>
                <p className="font-mono">{formatGasPrice(transaction.maxFeePerGas)} Gwei</p>
              </div>
            )}
            
            {transaction.maxPriorityFeePerGas && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Max Priority Fee</label>
                <p className="font-mono">{formatGasPrice(transaction.maxPriorityFeePerGas)} Gwei</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Input Data */}
      {transaction.data && transaction.data !== '0x' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Input Data</span>
              <CopyButton text={transaction.data} field="inputData" />
            </CardTitle>
            <CardDescription>Raw transaction input data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-mono text-xs break-all">{transaction.data}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Logs/Events */}
      {transaction.logs && transaction.logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Events ({transaction.logs.length})</CardTitle>
            <CardDescription>Events emitted by this transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transaction.logs.map((log, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Event #{log.logIndex}</Badge>
                    <AddressLink address={log.address} className="font-mono text-sm" />
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Topics</label>
                      <div className="space-y-1">
                        {log.topics.map((topic, topicIndex) => (
                          <p key={topicIndex} className="font-mono text-xs break-all bg-muted p-2 rounded">
                            {topic}
                          </p>
                        ))}
                      </div>
                    </div>
                    
                    {log.data !== '0x' && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Data</label>
                        <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                          {log.data}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* External Links */}
      <Card>
        <CardHeader>
          <CardTitle>External Links</CardTitle>
          <CardDescription>View this transaction on other explorers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {network === 'ethereum' && (
              <a
                href={`https://etherscan.io/tx/${transaction.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Etherscan
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
            
            {network === 'base' && (
              <a
                href={`https://basescan.org/tx/${transaction.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Basescan
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    <Footer />
    </>
  );
}

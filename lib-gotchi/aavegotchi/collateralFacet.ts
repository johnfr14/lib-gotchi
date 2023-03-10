import { ethers } from "ethers"
import FACET_ABI from "./abis/CollateralFacet.json"
import { AAVEGOTCHI_DIAMOND_ADDRES, SIGNER, PROVIDER } from "../constant"
import { AavegotchiCollateralTypeIO } from "./types"

/*
  |***********************************|
  |        FACET INTERFACE            |
  |___________________________________| 

  EVENT
   -  IncreaseStake(uint256 indexed _tokenId, uint256 _stakeAmount);
   -  DecreaseStake(uint256 indexed _tokenId, uint256 _reduceAmount);
   -  ExperienceTransfer(uint256 indexed _fromTokenId, uint256 indexed _toTokenId, uint256 experience);

  READ
    -  collaterals(uint256 _hauntId) external view returns (address[] memory collateralTypes_)
    -  collateralInfo(uint256 _hauntId, uint256 _collateralId) external view returns (AavegotchiCollateralTypeIO memory collateralInfo_)
    -  getCollateralInfo(uint256 _hauntId) external view returns (AavegotchiCollateralTypeIO[] memory collateralInfo_)
    -  getAllCollateralTypes() external view returns (address[] memory)
    -  collateralBalance(uint256 _tokenId)returns (address collateralType_, address escrow_, uint256 balance_)
    
    WRITE 
    -  increaseStake(uint256 _tokenId, uint256 _stakeAmount) external onlyAavegotchiOwner(_tokenId)
    -  decreaseStake(uint256 _tokenId, uint256 _reduceAmount) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId)
    -  decreaseAndDestroy(uint256 _tokenId, uint256 _toId) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId)
    !  setCollateralEyeShapeSvgId(address _collateralToken, uint8 _svgId) external onlyDaoOrOwner 
*/

export const collateralFacet = new ethers.Contract(AAVEGOTCHI_DIAMOND_ADDRES, FACET_ABI.abi, SIGNER)




/***********************************|
|               READ                |
|__________________________________*/

/**
 * @name collaterals
 * @notice Query addresses about all collaterals available for a particular haunt
 * @param _hauntId identifier of the haunt to query
 * @return collateralTypes_ An array containing the addresses of all collaterals available for haunt `_hauntId`
 */
export const collaterals = async(hauntId: number): Promise<string[]> => {
    try {
        const collaterals = await collateralFacet.collaterals(hauntId)
        return collaterals
    } catch (error: any) {
        throw new Error(error)
    }
}

/**
 * @name collateralInfo
 * @notice Query all details about a collateral in a haunt
 * @param _hauntId The identifier of the haunt to query
 * @param _collateralId the identifier of the collateral to query
 * @return collateralInfo_ A struct containing extensive details about a collateral of identifier `_collateralId` in haunt `_hauntId`
 */
export const collateralInfo = async (hauntId: number, collateralId: number): Promise<AavegotchiCollateralTypeIO> => {
    try {
        const ret = await collateralFacet.collateralInfo(hauntId, collateralId)
        return {collateralType: ret.collateralType, collateralTypeInfo: ret.collateralTypeInfo}
    } catch (error: any) {
        throw new Error(error)
    }
}

/**
 * @name getCollateralInfo
 * @notice Query all details about a collateral in a haunt
 * @param _hauntId The identifier of the haunt to query
 * @return collateralInfo_ An array of structs where each struct contains extensive details about each collateral that is available in haunt `_hauntId`
 */
export const getCollateralInfo = async (hauntId: number): Promise<AavegotchiCollateralTypeIO[]> => {
    let collateralsInfo: AavegotchiCollateralTypeIO[] = []
    try {
        const ret = await collateralFacet.getCollateralInfo(hauntId)
        collateralsInfo = ret.map(( c: AavegotchiCollateralTypeIO ) => {
            return {collateralType: c.collateralType, collateralTypeInfo: c.collateralTypeInfo}
        })

        return collateralsInfo
    } catch (error: any) {
        throw new Error(error)
    }
}

/**
 * @name getAllCollateralTypes
 * @notice Query the address of all collaterals that are available universally throughout all haunts
 * @return An array of addresses,each address representing a collateral's contract address
 */
export const getAllCollateralTypes = async(): Promise<string[]> => {
    try {
        const allCollaterals = await collateralFacet.getAllCollateralTypes()
        return allCollaterals
    } catch (error: any) {
        throw new Error(error)
    }
}

/**
 * @name collateralBalance
 * @notice Query the collateral address,balance and escrow contract of an NFT
 * @dev Only valid for claimed aavegotchis
 * @param _tokenId the identifier of the NFT to query
 * @return collateralType_ The contract address of the collateral
 * @return escrow_ The contract address of the NFT's escrow contract
 * @return balance_ The collateral balance of the NFT 
 */
export const collateralBalance = async (tokenId: number): Promise<{collateralType: string, escrow: string, balance: number}> => {
    try {
        const ret = await collateralFacet.collateralBalance(tokenId)
        return {collateralType: ret.collateralType_, escrow: ret.escrow_, balance: ret.balance_}
    } catch (error: any) {
        throw new Error(error)
    }
}











/***********************************|
|               WRITE               |
|__________________________________*/

/**
 * @name increaseStake
 * @notice Allow the owner of a claimed aavegotchi to increase its collateral stake
 * @dev Only valid for claimed aavegotchis
 * @param _tokenId The identifier of the NFT to increase
 * @param _stakeAmount The amount of collateral tokens to increase the current collateral by
 */
export const increaseStake = async (tokenId: number, stakeAmount: number): Promise<void> => {
    try {
        console.log(`Increasing stake of ${tokenId} by ${stakeAmount}`)

        const gasPrice = await PROVIDER.getGasPrice()
        console.log("gas price in gwei", ethers.utils.formatUnits(gasPrice, "gwei"))

        const tx = await collateralFacet.increaseStake(tokenId, stakeAmount, {gasPrice: gasPrice})
        await tx.wait()
        console.log("Transaction validated !\n")
    } catch (error: any) {
        throw new Error(error)
    }
}

/**
 * @name decreaseStake
 * @notice Allow the owner of a claimed aavegotchi to decrease its collateral stake
 * @dev Only valid for claimed aavegotchis
 * @dev Will throw if it is reduced less than the minimum stake 
 * @param _tokenId The identifier of the NFT to decrease
 * @param _reduceAmount The amount of collateral tokens to decrease the current collateral by
 */
export const decreaseStake = async (tokenId: number, reduceAmount: number): Promise<void> => {
    try {
        console.log(`Reducing stake of ${tokenId} by ${reduceAmount}`)

        const gasPrice = await PROVIDER.getGasPrice()
        console.log("gas price in gwei", ethers.utils.formatUnits(gasPrice, "gwei"))

        const tx = await collateralFacet.decreaseStake(tokenId, reduceAmount, {gasPrice: gasPrice})
        await tx.wait()
        console.log("Transaction validated !\n")
    } catch (error: any) {
        throw new Error(error)
    }
}

/**
 * @name decreaseAndDestroy
 * @notice Allow the owner of an aavegotchi to destroy his aavegotchi and transfer the XP points to another aavegotchi
 * @dev Only valid for claimed aavegotchisi
 * @dev Name assigned to destroyed aavegotchi is freed up for use by another aavegotch
 * @param _tokenId Identifier of NFT to destroy
 * @param _toId Identifier of another claimed aavegotchi where the XP of the sacrificed aavegotchi will be sent
 */
export const decreaseAndDestroy = async(tokenId: number, toId: number): Promise<void> => {
    try {
        console.log(`Destroying gotchi: ${tokenId} and send its xp to gotchi: ${toId}...`)

        const gasPrice = await PROVIDER.getGasPrice()
        console.log("gas price in gwei", ethers.utils.formatUnits(gasPrice, "gwei"))

        const tx = await collateralFacet.decreaseAndDestroy(tokenId, toId, {gasPrice: gasPrice})
        await tx.wait()
        console.log("Transaction validated !\n")
    } catch (error: any) {
        throw new Error(error)
    }
}


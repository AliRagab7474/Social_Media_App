export interface LoginResponse{
    access_token:string,
    refresh_token:string
}
export interface SignupResponse extends LoginResponse{
    _id:number
}
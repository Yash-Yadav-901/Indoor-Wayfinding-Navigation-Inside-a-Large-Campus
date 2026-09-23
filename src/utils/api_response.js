class ApiResponse {

    constructor(statusCoded,  data, message="success" ) {

        this.statusCoded = statusCoded;

        this.message = message;

        this.data = data;

        this.success = statusCoded < 400;

    }

}

export { ApiResponse };
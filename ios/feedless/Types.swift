//
//  Types.swift
//  feedless
//
//  Created by Rogerio Chaves on 04/05/20.
//  Copyright © 2020 Rogerio Chaves. All rights reserved.
//

typealias Posts = [PostEntry]

struct Post: Codable {
    public var text: String?
    public var inReplyTo: Profile?
    public var root: String?
}

typealias PostEntry = Entry<AuthorProfileContent<Post>>

struct AuthorContent<T: Codable>: Codable {
    public var author: String
    public var content: T
}

struct AuthorProfileContent<T: Codable>: Codable {
    public var author: String
    public var authorProfile: Profile
    public var content: T
    public var deleted: Bool?
    public var hidden: Bool?
}

struct Entry<T: Codable>: Codable {
    public var key: String
    public var value: T
    public var rts: Int?
}

struct Profile: Codable {
    public var id: String
    public var name: String?
    public var image: String?
}

struct SSBKey : Decodable {
    enum CodingKeys: String, CodingKey {
        case curve
        case publicKey = "public"
        case privateKey = "private"
        case id
    }

    var curve : String
    var publicKey : String
    var privateKey : String
    var id : String
}

enum ServerData<T> {
    case notAsked
    case loading
    case success(T)
    case error(String)
}

struct PostResult : Codable {
    public var result : String
}
